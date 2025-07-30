'use client';

import { useState } from 'react';
import { Heart, ArrowLeft } from 'lucide-react';
import UserForm from '@/components/recommend/UserForm';
import ManpukunChat from '@/components/recommend/ManpukunChat';
import { RecommendationRequest, RecommendationResult, APIResponse } from '@/types';

export default function RecommendPage() {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [showForm, setShowForm] = useState(true);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (formData: RecommendationRequest) => {
    setLoading(true);
    setError('');
    setShowForm(false);

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result: APIResponse = await response.json();

      if (result.success) {
        setRecommendations(result.data?.recommendations || []);
      } else {
        setError(result.message || '推薦の取得に失敗しました。');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました。しばらくしてからお試しください。');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setShowForm(true);
    setRecommendations([]);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* ヘッダー */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-xl">🍙</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    まんぷくんのおすすめ返礼品
                  </h1>
                  <p className="text-sm text-gray-600">
                    あなたにぴったりの返礼品を見つけよう！
                  </p>
                </div>
              </div>
              
              {!showForm && (
                <button
                  onClick={handleRetry}
                  className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft size={16} />
                  <span>条件を変更</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showForm ? (
          /* 入力フォーム画面 */
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-3xl">🍙</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                こんにちは！まんぷくんです
              </h2>
              <p className="text-gray-600 leading-relaxed">
                あなたの好みや条件を教えてもらえれば、<br />
                ぴったりの返礼品をおすすめさせてもらいますで〜！
              </p>
            </div>

            <UserForm onSubmit={handleSubmit} loading={loading} />

            {/* 特徴紹介 */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  あなた専用の推薦
                </h3>
                <p className="text-sm text-gray-600">
                  家族構成や好みに合わせて、最適な返礼品をピックアップ
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  AI による分析
                </h3>
                <p className="text-sm text-gray-600">
                  まんぷくんがAIで分析して、理由付きでおすすめを提案
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">💝</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  安心・安全
                </h3>
                <p className="text-sm text-gray-600">
                  アレルギー情報を考慮した、安心してお選びいただける商品
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* 推薦結果画面 */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* チャット画面 */}
            <div className="lg:col-span-2">
              <ManpukunChat 
                recommendations={recommendations} 
                loading={loading} 
              />
              
              {error && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                      <span className="text-sm">🍙</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-red-800 mb-1">
                        申し訳ありません...
                      </h4>
                      <p className="text-red-700">{error}</p>
                      <button
                        onClick={handleRetry}
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        もう一度試す
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* サイドバー */
