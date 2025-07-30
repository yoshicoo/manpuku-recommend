import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import { CSVRowData, ReturnGift, APIResponse } from '@/types';

const supabase = createClient(
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
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json<APIResponse>({
        success: false,
        message: 'ファイルが見つかりません。'
      }, { status: 400 });
    }

    // CSVファイルの内容を読み取り
    const csvText = await file.text();
    
    // Papa Parseを使用してCSVをパース
    const parseResult = Papa.parse<CSVRowData>(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // 文字列として保持
      transformHeader: (header) => header.trim() // ヘッダーの空白を除去
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json<APIResponse>({
        success: false,
        message: `CSVパースエラー: ${parseResult.errors[0].message}`
      }, { status: 400 });
    }

    // データ変換
    const returnGifts = parseResult.data
      .filter(row => row.返礼品ID && row.返礼品名) // 必須フィールドをチェック
      .map(transformCSVToReturnGift);

    if (returnGifts.length === 0) {
      return NextResponse.json<APIResponse>({
        success: false,
        message: '有効なデータが見つかりませんでした。返礼品IDと返礼品名は必須です。'
      }, { status: 400 });
    }

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

    // 新しいデータを一括挿入
    const { data, error: insertError } = await supabase
      .from('return_gifts')
      .insert(returnGifts)
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json<APIResponse>({
        success: false,
        message: `データ挿入エラー: ${insertError.message}`
      }, { status: 500 });
    }

    // CSVアップロード履歴を記録
    await supabase
      .from('csv_uploads')
      .insert({
        filename: file.name,
        record_count: returnGifts.length,
        status: 'completed'
      });

    return NextResponse.json<APIResponse>({
      success: true,
      message: `${returnGifts.length}件のデータを正常にアップロードしました。`,
      data: {
        recordCount: returnGifts.length,
        uploadedData: data
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
