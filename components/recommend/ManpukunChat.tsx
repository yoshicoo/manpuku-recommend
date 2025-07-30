'use client';

import { useState, useEffect } from 'react';
import { RecommendationResult, ManpukunExpression } from '@/types';
import { Star, ExternalLink, Gift, Clock, Truck } from 'lucide-react';

interface ManpukunChatProps {
  recommendations?: RecommendationResult[];
  loading?: boolean;
}

interface ChatMessage {
  id: string;
  type: 'greeting' | 'thinking' | 'recommendation' | 'error';
  content: string;
  expression: ManpukunExpression;
  timestamp: Date;
  recommendations?: RecommendationResult[];
}

export default function ManpukunChat({ recommendations, loading }: ManpukunChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentExpression, setCurrentExpression] = useState<ManpukunExpression>('happy');

  useEffect(() => {
    // 初回挨拶メッセージ
    if (messages.length === 0) {
      addMessage({
        type: 'greeting',
        content: 'はじめまして！ワイはまんぷくんや🎵\nあなたにぴったりの返礼品を見つけるお手伝いをさせてもらうで〜！',
        expression: 'happy'
      });
    }
  }, []);

  useEffect(() => {
    if (loading) {
      addMessage({
        type: 'thinking',
        content: 'ちょっと待ってな〜、あなたにぴったりの返礼品を一生懸命探してるで！\n美味しいもんがいっぱいあるから迷っちゃうわ〜😊',
        expression: 'thinking'
      });
    }
  }, [loading]);

  useEffect(() => {
    if (recommendations && recommendations.length > 0) {
      addMessage({
        type: 'recommendation',
        content: `お待たせしました〜！あなたにおすすめの返礼品を${recommendations.length}つ見つけたで〜🎁\nどれも自信を持っておすすめできる逸品やから、ぜひチェックしてみてな〜！`,
        expression: 'recommending',
        recommendations
      });
    }
  }, [recommendations]);

  const addMessage = (messageData: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...messageData,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    setCurrentExpression(messageData.expression);
  };

  const formatPrice = (amount: number) => {
    return amount.toLocaleString() + '円';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
  };

  const getExpressionImage = (expression: ManpukunExpression) => {
    // 実際の実装では、まんぷくんの画像パスを返す
    return `/manpukun/${expression}.png`;
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 min-h-[400px]">
      {/* まんぷくんのアバター */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg">
            {/* 実際の実装では画像を使用 */}
            <span className="text-2xl">🍙</span>
          </div>
          {loading && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
          )}
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">まんぷくん</h3>
          <p className="text-sm text-gray-600">ふるさと納税アドバイザー</p>
        </div>
      </div>

      {/* チャットメッセージ */}
      <div className="space-y-6">
        {messages.map((message) => (
          <div key={message.id} className="flex space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm">🍙</span>
            </div>
            <div className="flex-1">
              <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm border">
                <p className="text-gray-800 whitespace-pre-line leading-relaxed">
                  {message.content}
                </p>
                
                {/* 推薦結果の表示 */}
                {message.recommendations && (
                  <div className="mt-6 space-y-4">
                    {message.recommendations.map((rec, index) => (
                      <div key={rec.gift.id || index} className="bg-gray-50 rounded-xl p-4 border">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 line-clamp-2 mb-1">
                              {rec.gift.name}
                            </h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-lg font-bold text-blue-600">
                                {formatPrice(rec.gift.donation_amount)}
                              </span>
                              <div className="flex items-center">
                                {renderStars(rec.rating)}
                                <span className="ml-1 text-sm text-gray-600">
                                  ({rec.rating}/5)
                                </span>
                              </div>
                            </div>
                          </div>
                          <Gift className="text-gray-400 flex-shrink-0 ml-3" size={20} />
                        </div>

                        {/* カテゴリと配送情報 */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {rec.gift.category && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              {rec.gift.category.split('|')[0]}
                            </span>
                          )}
                          <div className="flex items-center space-x-1">
                            <Truck size={12} className="text-gray-500" />
                            <span className="text-xs text-gray-600">
                              {rec.gift.temp_shipping && '常温'}
                              {rec.gift.cold_shipping && '冷蔵'}
                              {rec.gift.frozen_shipping && '冷凍'}
                            </span>
                          </div>
                          {rec.gift.shipping_estimate && (
                            <div className="flex items-center space-x-1">
                              <Clock size={12} className="text-gray-500" />
                              <span className="text-xs text-gray-600">
                                {rec.gift.shipping_estimate}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* まんぷくんのコメント */}
                        <div className="bg-orange-50 border-l-4 border-orange-400 p-3 mb-3">
                          <p className="text-sm text-orange-800 font-medium">
                            まんぷくんからひとこと：
                          </p>
                          <p className="text-sm text-orange-700 mt-1">
                            {rec.manpukunComment}
                          </p>
                        </div>

                        {/* おすすめ理由 */}
                        <div className="mb-3">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {rec.reason}
                          </p>
                        </div>

                        {/* メリット・デメリット */}
                        {rec.pros && rec.pros.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-medium text-green-700 mb-1">👍 ここがええとこ：</p>
                            <ul className="text-xs text-green-600 space-y-1">
                              {rec.pros.map((pro, i) => (
                                <li key={i}>• {pro}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {rec.cons && rec.cons.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-medium text-orange-700 mb-1">⚠️ ちょっと注意：</p>
                            <ul className="text-xs text-orange-600 space-y-1">
                              {rec.cons.map((con, i) => (
                                <li key={i}>• {con}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 詳細ボタン（将来的にはまん福のURLに遷移） */}
                        <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center space-x-2">
                          <ExternalLink size={14} />
                          <span>詳細を見る・申し込む</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {message.timestamp.toLocaleTimeString('ja-JP', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        ))}

        {/* ローディング表示 */}
        {loading && (
          <div className="flex space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm">🍙</span>
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm border">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-600">考え中...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
