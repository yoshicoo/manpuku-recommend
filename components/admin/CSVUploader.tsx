'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import Papa from 'papaparse';
import { APIResponse, CSVRowData, ReturnGift } from '@/types';
import { transformCSVToReturnGift } from '@/lib/transform';

interface CSVUploaderProps {
  onUploadComplete?: (recordCount: number) => void;
}

export default function CSVUploader({ onUploadComplete }: CSVUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    recordCount?: number;
  }>({ type: null, message: '' });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadStatus({
        type: 'error',
        message: 'CSVファイルのみアップロード可能です。'
      });
      return;
    }

    setUploading(true);
    setUploadStatus({ type: null, message: '' });

    const BATCH_SIZE = 1000;
    let buffer: Partial<ReturnGift>[] = [];
    let totalCount = 0;

    const postJSON = async (payload: any) => {
      const res = await fetch('/api/upload-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json: APIResponse = await res.json();
      if (!json.success) {
        throw new Error(json.message);
      }
    };

    try {
      // initialize by clearing existing data
      await postJSON({ init: true });

      await new Promise<void>((resolve, reject) => {
        Papa.parse<CSVRowData>(file, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false,
          worker: true,
          chunk: async (results, parser) => {
            parser.pause();
            try {
              for (const row of results.data) {
                const sanitized: Partial<CSVRowData> = {};
                for (const [key, value] of Object.entries(row as CSVRowData)) {
                  sanitized[key.replace(/^\uFEFF/, '').trim() as keyof CSVRowData] = value as any;
                }
                if ((sanitized as CSVRowData).返礼品ID && (sanitized as CSVRowData).返礼品名) {
                  buffer.push(transformCSVToReturnGift(sanitized as CSVRowData));
                }
                if (buffer.length >= BATCH_SIZE) {
                  const batch = buffer.splice(0, buffer.length);
                  await postJSON({ records: batch });
                  totalCount += batch.length;
                }
              }
            } catch (err) {
              parser.abort();
              return reject(err);
            }
            parser.resume();
          },
          complete: async () => {
            try {
              if (buffer.length > 0) {
                const batch = buffer.splice(0, buffer.length);
                await postJSON({ records: batch });
                totalCount += batch.length;
              }
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          error: (err) => reject(err)
        });
      });

      await postJSON({ final: true, filename: file.name, totalCount });

      setUploadStatus({
        type: 'success',
        message: `${totalCount}件のデータを正常にアップロードしました。`,
        recordCount: totalCount
      });

      onUploadComplete?.(totalCount);
    } catch (error: any) {
      setUploadStatus({
        type: 'error',
        message: error.message || 'アップロードに失敗しました。'
      });
    } finally {
      setUploading(false);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false,
    disabled: uploading
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          <div className="text-gray-400">
            {uploading ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            ) : (
              <Upload size={48} />
            )}
          </div>
          
          <div>
            {uploading ? (
              <p className="text-lg font-medium text-gray-700">
                アップロード中...
              </p>
            ) : isDragActive ? (
              <p className="text-lg font-medium text-blue-600">
                ファイルをドロップしてください
              </p>
            ) : (
              <>
                <p className="text-lg font-medium text-gray-700">
                  CSVファイルをドラッグ&ドロップ
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  または、クリックしてファイルを選択
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* アップロード状況表示 */}
      {uploadStatus.type && (
        <div className={`
          mt-4 p-4 rounded-lg flex items-start space-x-3
          ${uploadStatus.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
          }
        `}>
          <div className="flex-shrink-0">
            {uploadStatus.type === 'success' ? (
              <CheckCircle className="text-green-600" size={20} />
            ) : (
              <AlertCircle className="text-red-600" size={20} />
            )}
          </div>
          <div>
            <p className={`
              font-medium 
              ${uploadStatus.type === 'success' ? 'text-green-800' : 'text-red-800'}
            `}>
              {uploadStatus.message}
            </p>
            {uploadStatus.recordCount && (
              <p className="text-sm text-green-600 mt-1">
                {uploadStatus.recordCount}件のデータが正常に登録されました。
              </p>
            )}
          </div>
        </div>
      )}

      {/* 使用方法の説明 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-start space-x-3">
          <FileText className="text-gray-600 flex-shrink-0" size={20} />
          <div>
            <h4 className="font-medium text-gray-800 mb-2">CSVファイルの形式について</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• ヘッダー行を含むCSV形式である必要があります</li>
              <li>• 文字コードはUTF-8で保存してください</li>
              <li>• 必須項目：返礼品ID、返礼品名、寄付金額</li>
              <li>• アップロード前に既存データは削除されます</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
