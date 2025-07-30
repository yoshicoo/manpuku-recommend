import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import Busboy from 'busboy';
import { Readable } from 'stream';
import { CSVRowData, ReturnGift, APIResponse } from '@/types';

// Allow large CSV uploads (up to 1GB)
export const runtime = 'nodejs';
export const maxDuration = 300; // allow long processing of large files

const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// CSVの生データをSupabase用のデータに変換
function transformCSVToReturnGift(csvRow: CSVRowData): Partial<ReturnGift> {
  return {
    gift_id: csvRow.返礼品ID,
    name: csvRow.返礼品名,
    description: csvRow.返礼品説明 || '',
    start_date: csvRow.提供開始日時 ? new Date(csvRow.提供開始日時).toISOString() : undefined,
    end_date: csvRow.提供終了日時 ? new Date(csvRow.提供終了日時).toISOString() : undefined,
    donation_amount: parseInt(csvRow.寄付金額) || 0,
    stock_quantity: csvRow.在庫数 ? parseFloat(csvRow.在庫数) : undefined,
    capacity_weight: csvRow['容量・重さ'] || '',
    provider_info: csvRow.提供企業情報 || '',
    shipping_estimate: csvRow.発送目安 || '',
    notes: csvRow.注意事項 || '',
    is_public: csvRow.公開フラグ === '1',
    temp_shipping: csvRow.常温配送対応フラグ === '1',
    cold_shipping: csvRow.冷蔵配送対応フラグ === '1',
    frozen_shipping: csvRow.冷凍配送対応フラグ === '1',
    regular_delivery: csvRow.定期配送対応フラグ === '1',
    date_specified_delivery: csvRow.日付指定配送対応フラグ === '1',
    split_delivery: csvRow.分割配送対応フラグ === '1',
    simple_packaging: csvRow.簡易包装フラグ === '1',
    noshi_support: csvRow.のし対応フラグ === '1',
    municipality_code: csvRow.自治体管理番号 || '',
    expiry_storage: csvRow['賞味期限・保存'] || '',
    allergens: csvRow.アレルギー || '',
    allergen_notes: csvRow.アレルギー備考 || '',
    category: csvRow.カテゴリ || '',
    linked_service: csvRow.連携サービス || ''
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();

    const contentType = request.headers.get('content-type') || '';
    const busboy = Busboy({ headers: { 'content-type': contentType } });
    let uploadedFilename = '';

    const BATCH_SIZE = 1000;
    let recordCount = 0;
    let buffer: Partial<ReturnGift>[] = [];

    const parsePromise = new Promise<void>((resolve, reject) => {
      busboy.on('file', (_field, fileStream, info) => {
        uploadedFilename = info.filename;
        const csvStream = fileStream.pipe(
          Papa.parse(Papa.NODE_STREAM_INPUT, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: false,
            transformHeader: (header: string) => header.trim(),
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

        csvStream.on('error', reject);
      });

      busboy.on('finish', async () => {
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

      busboy.on('error', reject);

      Readable.fromWeb(request.body as any).pipe(busboy);
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
        filename: uploadedFilename,
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
