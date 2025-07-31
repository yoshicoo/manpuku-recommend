import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import { Readable } from 'stream';
import Busboy from 'busboy';
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
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { init, final, records, filename, totalCount } = body as {
        init?: boolean;
        final?: boolean;
        filename?: string;
        totalCount?: number;
        records?: Partial<ReturnGift>[];
      };

      if (init) {
        const { error } = await supabase.from('return_gifts').delete().neq('id', 0);
        if (error) {
          return NextResponse.json<APIResponse>({ success: false, message: '既存データの削除に失敗しました。' }, { status: 500 });
        }
        return NextResponse.json<APIResponse>({ success: true, message: 'initialized' });
      }

      if (records && records.length > 0) {
        const { error } = await supabase.from('return_gifts').insert(records);
        if (error) {
          return NextResponse.json<APIResponse>({ success: false, message: error.message }, { status: 500 });
        }
        return NextResponse.json<APIResponse>({ success: true, message: `${records.length} records inserted` });
      }

      if (final && filename) {
        await supabase.from('csv_uploads').insert({ filename, record_count: totalCount || 0, status: 'completed' });
        return NextResponse.json<APIResponse>({ success: true, message: 'completed' });
      }

      return NextResponse.json<APIResponse>({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json<APIResponse>({
        success: false,
        message: 'multipart/form-data expected'
      }, { status: 400 });
    }

    let filename = '';
    const BATCH_SIZE = 1000;
    let recordCount = 0;
    let buffer: Partial<ReturnGift>[] = [];

    const busboy = Busboy({ headers: Object.fromEntries(request.headers) });

    const parsePromise = new Promise<void>((resolve, reject) => {
      busboy.on('file', (_field, stream, info) => {
        filename = info.filename;

        const csvStream = stream.pipe(
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

      busboy.on('error', reject);

      // When busboy finishes reading the request body, if no file event was emitted,
      // resolve to avoid hanging the request.
      busboy.on('finish', () => {
        if (!filename) {
          reject(new Error('ファイルが見つかりません。'));
        }
      });

      // Pipe the incoming request body to busboy
      if (request.body) {
        Readable.fromWeb(request.body as any).pipe(busboy);
      } else {
        reject(new Error('No request body'));
      }
    });


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
