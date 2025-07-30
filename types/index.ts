// 返礼品データの型定義
export interface ReturnGift {
  id?: number;
  gift_id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  donation_amount: number;
  stock_quantity?: number;
  capacity_weight?: string;
  provider_info?: string;
  shipping_estimate?: string;
  notes?: string;
  is_public: boolean;
  temp_shipping: boolean;
  cold_shipping: boolean;
  frozen_shipping: boolean;
  regular_delivery: boolean;
  date_specified_delivery: boolean;
  split_delivery: boolean;
  simple_packaging: boolean;
  noshi_support: boolean;
  municipality_code?: string;
  expiry_storage?: string;
  allergens?: string;
  allergen_notes?: string;
  category?: string;
  linked_service?: string;
  created_at?: string;
  updated_at?: string;
}

// CSVアップロードの型定義
export interface CSVUploadRecord {
  id?: number;
  filename: string;
  upload_date?: string;
  record_count?: number;
  status: 'processing' | 'completed' | 'error';
}

// ユーザーの推薦条件
export interface RecommendationRequest {
  budget: {
    min: number;
    max: number;
  };
  categories: string[];
  familySize: 'single' | 'couple' | 'small_family' | 'large_family';
  allergies: string[];
  shippingPrefs: {
    temp: boolean;
    cold: boolean;
    frozen: boolean;
  };
  specialRequests?: string;
}

// 推薦結果
export interface RecommendationResult {
  gift: ReturnGift;
  reason: string;
  rating: number;
  manpukunComment: string;
  pros: string[];
  cons?: string[];
}

// APIレスポンス共通型
export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// まんぷくんの表情・ポーズタイプ
export type ManpukunExpression = 
  | 'happy' 
  | 'thinking' 
  | 'excited' 
  | 'recommending' 
  | 'surprised';

// CSVの生データ（アップロード時）
export interface CSVRowData {
  返礼品ID: string;
  返礼品名: string;
  返礼品説明: string;
  提供開始日時?: string;
  提供終了日時?: string;
  提供期間?: string;
  寄付金額: string;
  在庫数?: string;
  '容量・重さ'?: string;
  提供企業情報?: string;
  発送目安?: string;
  注意事項?: string;
  公開フラグ: string;
  常温配送対応フラグ: string;
  冷蔵配送対応フラグ: string;
  冷凍配送対応フラグ: string;
  定期配送対応フラグ: string;
  日付指定配送対応フラグ: string;
  分割配送対応フラグ: string;
  簡易包装フラグ: string;
  のし対応フラグ: string;
  自治体管理番号?: string;
  '賞味期限・保存'?: string;
  アレルギー?: string;
  アレルギー備考?: string;
  カテゴリ?: string;
  連携サービス?: string;
}

// フィルタリング条件
export interface FilterConditions {
  minAmount?: number;
  maxAmount?: number;
  categories?: string[];
  excludeAllergens?: string[];
  shippingTypes?: ('temp' | 'cold' | 'frozen')[];
  hasStock?: boolean;
  isPublic?: boolean;
}
