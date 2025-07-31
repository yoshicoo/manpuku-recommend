import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import { Readable } from 'stream';
import { CSVRowData, ReturnGift, APIResponse } from '@/types';
import { transformCSVToReturnGift } from '@/lib/transform';

// Allow large CSV uploads (up to 1GB)
export const runtime = 'nodejs';
export const maxDuration = 300;

const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );


export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json<APIResponse>({
        success: false,
        message: 'ファイルが見つかりません。'
      }, { status: 400 });
    }

    const nodeStream = Readable.fromWeb((file as any).stream());

    const BATCH_SIZE = 1000;
    let recordCount = 0;
    let buffer: Partial<ReturnGift>[] = [];

    const parsePromise = new Promise<void>((resolve, reject) => {
      const csvStream = nodeStream.pipe(
        Papa.parse(Papa.NODE_STREAM_INPUT, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false,
          transformHeader: (header: string) =>
            header.replace(/^\uFEFF/, '').trim(),
        })
      );

      csvStream.on('data', async (row: CSVRowData) => {
        csvStream.pause();
        try {
          if (row.返礼品ID && row.返礼品名) {
            buffer.push(transformCSVToReturnGift(row));
          }
          if (buffer.length >= BATCH_SIZE) {
            const { error } = await supabase.from('return_gifts').insert(buffer);
            if (error) return reject(error);
            recordCount += buffer.length;
            buffer = [];
          }
        } catch (err) {
          return reject(err);
        } finally {
          csvStream.resume();
        }
      });

      csvStream.on('end', async () => {
        try {
          if (buffer.length > 0) {
            const { error } = await supabase.from('return_gifts').insert(buffer);
            if (error) return reject(error);
            recordCount += buffer.length;
            buffer = [];
          }
          resolve();
        } catch (err) {
          reject(err);
        }
      });

      csvStream.on('error', reject);
    });

    const filename = file.name;


    // 既存データを削除
    const { error: deleteError } = await supabase
      .from('return_gifts')
      .delete()
      .neq('id', 0); // 全削除

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json<APIResponse>({
        success: false,
        message: '既存データの削除に失敗しました。'
      }, { status: 500 });
    }

    // ストリームのパースとデータ挿入を実行
    try {
      await parsePromise;
    } catch (parseErr: any) {
      console.error('Parse error:', parseErr);
      return NextResponse.json<APIResponse>({
        success: false,
        message: `CSVパースエラー: ${parseErr.message}`
      }, { status: 400 });
    }

    // CSVアップロード履歴を記録
    await supabase
      .from('csv_uploads')
      .insert({
        filename,
        record_count: recordCount,
        status: 'completed'
      });

    return NextResponse.json<APIResponse>({
      success: true,
      message: `${recordCount}件のデータを正常にアップロードしました。`,
      data: {
        recordCount
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json<APIResponse>({
      success: false,
      message: 'サーバーエラーが発生しました。'
    }, { status: 500 });
  }
}
