'use client';

import { useState } from 'react';
import { Search, Users, AlertTriangle, Truck } from 'lucide-react';
import { RecommendationRequest } from '@/types';

interface UserFormProps {
  onSubmit: (data: RecommendationRequest) => void;
  loading?: boolean;
}

const CATEGORY_OPTIONS = [
  { value: 'meat', label: '肉類', emoji: '🥩' },
  { value: 'seafood', label: '魚介類', emoji: '🐟' },
  { value: 'fruit', label: '果物', emoji: '🍎' },
  { value: 'vegetable', label: '野菜', emoji: '🥬' },
  { value: 'rice', label: '米・穀物', emoji: '🌾' },
  { value: 'dairy', label: '乳製品', emoji: '🧀' },
  { value: 'alcohol', label: 'お酒', emoji: '🍶' },
  { value: 'sweets', label: 'スイーツ', emoji: '🍰' },
  { value: 'processed', label: '加工品', emoji: '🥫' },
  { value: 'set', label: 'セット・詰合せ', emoji: '📦' }
];

const ALLERGY_OPTIONS = [
  { value: 'egg', label: '卵' },
  { value: 'milk', label: '乳' },
  { value: 'wheat', label: '小麦' },
  { value: 'buckwheat', label: 'そば' },
  { value: 'peanut', label: '落花生' },
  { value: 'shrimp', label: 'えび' },
  { value: 'crab', label: 'かに' },
  { value: 'orange', label: 'オレンジ' },
  { value: 'kiwi', label: 'キウイフルーツ' },
  { value: 'peach', label: 'もも' },
  { value: 'apple', label: 'りんご' },
  { value: 'banana', label: 'バナナ' }
];

const FAMILY_SIZE_OPTIONS = [
  { value: 'single', label: '一人暮らし', icon: '👤' },
  { value: 'couple', label: '夫婦・カップル', icon: '👫' },
  { value: 'small_family', label: '3-4人家族', icon: '👨‍👩‍👧' },
  { value: 'large_family', label: '5人以上の家族', icon: '👨‍👩‍👧‍👦' }
];

export default function UserForm({ onSubmit, loading = false }: UserFormProps) {
  const [formData, setFormData] = useState<RecommendationRequest>({
    budget: { min: 10000, max: 50000 },
    categories: [],
    familySize: 'couple',
    allergies: [],
    shippingPrefs: {
      temp: true,
      cold: true,
      frozen: true
    },
    specialRequests: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleCategoryChange = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleAllergyChange = (allergy: string) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter(a => a !== allergy)
        : [...prev.allergies, allergy]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 予算設定 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-bold text-sm">¥</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">予算設定</h3>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                最小金額
              </label>
              <input
                type="number"
                min="1000"
                step="1000"
                value={formData.budget.min}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  budget: { ...prev.budget, min: parseInt(e.target.value) || 0 }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                最大金額
              </label>
              <input
                type="number"
                min="1000"
                step="1000"
                value={formData.budget.max}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  budget: { ...prev.budget, max: parseInt(e.target.value) || 0 }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="text-center text-sm text-gray-600">
            {formData.budget.min.toLocaleString()}円 ～ {formData.budget.max.toLocaleString()}円
          </div>
        </div>
      </div>

      {/* カテゴリ選択 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-600">🎯</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">興味のあるカテゴリ</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {CATEGORY_OPTIONS.map((category) => (
            <label
              key={category.value}
              className={`
                relative flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-all
                ${formData.categories.includes(category.value)
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <input
                type="checkbox"
                checked={formData.categories.includes(category.value)}
                onChange={() => handleCategoryChange(category.value)}
                className="sr-only"
              />
              <span className="text-2xl mb-1">{category.emoji}</span>
              <span className="text-sm font-medium text-center">{category.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 家族構成 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <Users className="text-purple-600" size={16} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">家族構成</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {FAMILY_SIZE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`
                relative flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all
                ${formData.familySize === option.value
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <input
                type="radio"
                name="familySize"
                value={option.value}
                checked={formData.familySize === option.value}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  familySize: e.target.value as any
                }))}
                className="sr-only"
              />
              <span className="text-2xl mb-2">{option.icon}</span>
              <span className="text-sm font-medium text-center">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* アレルギー情報 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="text-red-600" size={16} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">アレルギー情報</h3>
        </div>
        
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {ALLERGY_OPTIONS.map((allergy) => (
            <label
              key={allergy.value}
              className={`
                relative flex items-center justify-center p-2 rounded-lg border cursor-pointer transition-all text-sm
                ${formData.allergies.includes(allergy.value)
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <input
                type="checkbox"
                checked={formData.allergies.includes(allergy.value)}
                onChange={() => handleAllergyChange(allergy.value)}
                className="sr-only"
              />
              <span className="font-medium">{allergy.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 配送設定 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <Truck className="text-orange-600" size={16} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">配送設定</h3>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <label className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={formData.shippingPrefs.temp}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                shippingPrefs: { ...prev.shippingPrefs, temp: e.target.checked }
              }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-800">常温</div>
              <div className="text-sm text-gray-600">常温配送</div>
            </div>
          </label>
          
          <label className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={formData.shippingPrefs.cold}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                shippingPrefs: { ...prev.shippingPrefs, cold: e.target.checked }
              }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-800">冷蔵</div>
              <div className="text-sm text-gray-600">冷蔵配送</div>
            </div>
          </label>
          
          <label className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={formData.shippingPrefs.frozen}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                shippingPrefs: { ...prev.shippingPrefs, frozen: e.target.checked }
              }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-800">冷凍</div>
              <div className="text-sm text-gray-600">冷凍配送</div>
            </div>
          </label>
        </div>
      </div>

      {/* 特別なリクエスト */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">特別なリクエスト（任意）</h3>
        <textarea
          value={formData.specialRequests}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            specialRequests: e.target.value
          }))}
          placeholder="例：辛い物が好き、地元の特産品を試したい、ギフト用途など..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* 送信ボタン */}
      <button
        type="submit"
        disabled={loading || formData.categories.length === 0}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
        ) : (
          <Search size={20} />
        )}
        <span>{loading ? 'まんぷくんが選んでいます...' : 'まんぷくんにおすすめしてもらう！'}</span>
      </button>
    </form>
  );
}
