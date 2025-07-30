import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { RecommendationRequest, RecommendationResult, ReturnGift, APIResponse } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// カテゴリマッピング（ユーザー選択 → DB検索用）
const categoryMapping: Record<string, string[]> = {
  'meat': ['肉類', '牛肉', '豚肉', '鶏肉', 'ハム・ソーセージ'],
  'seafood': ['魚介類', '魚貝類', '海産物', 'カニ', 'エビ', 'ホタテ'],
  'fruit': ['果物', 'フルーツ', 'りんご', 'みかん', 'ぶどう', 'もも', 'いちご'],
  'vegetable': ['野菜', '野菜セット', '玉ねぎ', 'じゃがいも', 'にんじん'],
  'rice': ['米', '穀物', 'お米'],
  'dairy': ['乳製品', 'チーズ', 'バター', 'ヨーグルト'],
  'alcohol': ['お酒', '日本酒', 'ビール', 'ワイン', '焼酎'],
  'sweets': ['スイーツ', '菓子', 'ケーキ', 'アイス'],
  'processed': ['加工品', '調味料', '漬物'],
  'set': ['セット', '詰合せ', '詰め合わせ']
};

// アレルギーマッピング
const allergyMapping: Record<string, string[]> = {
  'egg': ['卵'],
  'milk': ['乳', '牛乳'],
  'wheat': ['小麦'],
  'buckwheat': ['そば'],
  'peanut': ['落花生', 'ピーナッツ'],
  'shrimp': ['えび', 'エビ'],
  'crab': ['かに', 'カニ', '蟹'],
  'orange': ['オレンジ'],
  'kiwi': ['キウイ', 'キウイフルーツ'],
  'peach': ['もも', 'モモ', '桃'],
  'apple': ['りんご', 'リンゴ', '林檎'],
  'banana': ['バナナ']
};
