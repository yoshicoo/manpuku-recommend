import { createAdminClient } from '../lib/supabase';
import Papa from 'papaparse';
import { CSVRowData, ReturnGift } from '../types';

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

async function main() {
  const bucket = process.argv[2];
  const filePath = process.argv[3];

  if (!bucket || !filePath) {
    console.error('Usage: ts-node scripts/import-csv-from-storage.ts <bucket> <path>');
    process.exit(1);
  }

  const supabase = createAdminClient();

  const { data: file, error } = await supabase.storage.from(bucket).download(filePath);
  if (error || !file) {
    throw new Error(`Failed to download file: ${error?.message}`);
  }

  const text = await file.text();
  const parseResult = Papa.parse<CSVRowData>(text, { header: true, skipEmptyLines: true, dynamicTyping: false });

  if (parseResult.errors.length > 0) {
    throw new Error(parseResult.errors[0].message);
  }

  const records = parseResult.data.filter(r => r.返礼品ID && r.返礼品名).map(transformCSVToReturnGift);

  // remove existing rows
  const { error: delErr } = await supabase.from('return_gifts').delete().neq('id', 0);
  if (delErr) throw delErr;

  const chunkSize = 1000;
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const { error: insErr } = await supabase.from('return_gifts').insert(chunk);
    if (insErr) throw insErr;
  }

  await supabase.from('csv_uploads').insert({ filename: filePath, record_count: records.length, status: 'completed' });

  console.log(`Imported ${records.length} records from ${filePath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
