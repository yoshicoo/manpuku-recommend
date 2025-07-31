import { createAdminClient } from '../lib/supabase';
import Papa from 'papaparse';
import { CSVRowData } from '../types';
import { transformCSVToReturnGift } from '../lib/transform';

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
  const parseResult = Papa.parse<CSVRowData>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (header: string) =>
      header.replace(/^\uFEFF/, '').trim(),
  });

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
