'use client';

import { useState } from 'react';
import { Upload, Database, FileText, AlertCircle } from 'lucide-react';
import CSVUploader from '@/components/admin/CSVUploader';

export default function AdminPage() {
  const [uploadCount, setUploadCount] = useState<number>(0);
  const [lastUpload, setLastUpload] = useState<Date | null>(null);

  const handleUploadComplete = (recordCount: number) => {
    setUploadCount(recordCount);
    setLastUpload(new Date());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Database className="text-blue-600" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  まん福返礼品管理システム
                </h1>
                <p className="text-gray-600">
                  返礼品データのアップロードと管理
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  最新アップロード
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {uploadCount > 0 ? `${uploadCount.toLocaleString()}件` : '未実行'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Upload className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  最終更新
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {lastUpload 
                    ? lastUpload.toLocaleDateString('ja-JP')
                    : '未実行'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Database className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  システム状態
                </p>
                <p className="text-lg font-semibold text-green-600">
                  正常
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CSVアップロードセクション */}
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              返礼品データのアップロード
            </h2>
            <p className="text-gray-600">
              CSV形式のファイルをアップロードして、返礼品データを更新します。
            </p>
          </div>

          <CSVUploader onUploadComplete={handleUploadComplete} />
        </div>

        {/* 注意事項 */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-1" size={20} />
            <div>
              <h3 className="font-semibold text-yellow-800 mb-2">
                重要な注意事項
              </h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• アップロード時に既存の全データが削除されます</li>
                <li>• ファイルサイズは最大1GBまでです</li>
                <li>• UTF-8エンコーディングで保存されたCSVファイルを使用してください</li>
                <li>• 必須項目：返礼品ID、返礼品名、寄付金額</li>
                <li>• アップロード中はブラウザを閉じないでください</li>
              </ul>
            </div>
          </div>
        </div>

        {/* システム情報 */}
        <div className="mt-8 bg-gray-100 rounded-xl p-6">
          <h3 className="font-semibold text-gray-800 mb-4">システム情報</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">バージョン:</span>
              <span className="ml-2 text-gray-800">v1.0.0</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">データベース:</span>
              <span className="ml-2 text-gray-800">Supabase</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">AI推薦:</span>
              <span className="ml-2 text-gray-800">ChatGPT-4</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">デプロイ:</span>
              <span className="ml-2 text-gray-800">Vercel</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
