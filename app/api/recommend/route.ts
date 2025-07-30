import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { RecommendationRequest, RecommendationResult, ReturnGift, APIResponse } from '@/types';

const getSupabase = () =>
  createClient(
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

// 返礼品をフィルタリングする関数
async function filterReturnGifts(request: RecommendationRequest): Promise<ReturnGift[]> {
  const supabase = getSupabase();
  let query = supabase
    .from('return_gifts')
    .select('*')
    .eq('is_public', true)
    .gte('donation_amount', request.budget.min)
    .lte('donation_amount', request.budget.max);

  // 在庫があるもののみ
  query = query.or('stock_quantity.is.null,stock_quantity.gt.0');

  const { data: allGifts, error } = await query;
  
  if (error) {
    throw new Error(`データベースエラー: ${error.message}`);
  }

  if (!allGifts) return [];

  // カテゴリでフィルタリング
  let filteredGifts = allGifts;
  if (request.categories.length > 0) {
    const searchCategories = request.categories.flatMap(cat => categoryMapping[cat] || []);
    filteredGifts = allGifts.filter(gift => {
      if (!gift.category) return false;
      return searchCategories.some(searchCat => 
        gift.category.toLowerCase().includes(searchCat.toLowerCase())
      );
    });
  }

  // アレルギーでフィルタリング（除外）
  if (request.allergies.length > 0) {
    const excludeAllergens = request.allergies.flatMap(allergy => allergyMapping[allergy] || []);
    filteredGifts = filteredGifts.filter(gift => {
      if (!gift.allergens) return true;
      return !excludeAllergens.some(allergen => 
        gift.allergens.toLowerCase().includes(allergen.toLowerCase())
      );
    });
  }

  // 配送方法でフィルタリング
  if (!request.shippingPrefs.temp && !request.shippingPrefs.cold && !request.shippingPrefs.frozen) {
    // 全て無効の場合はフィルタリングしない
  } else {
    filteredGifts = filteredGifts.filter(gift => {
      return (request.shippingPrefs.temp && gift.temp_shipping) ||
             (request.shippingPrefs.cold && gift.cold_shipping) ||
             (request.shippingPrefs.frozen && gift.frozen_shipping);
    });
  }

  return filteredGifts;
}

// ChatGPTで推薦を生成する関数
async function generateRecommendations(
  gifts: ReturnGift[], 
  request: RecommendationRequest
): Promise<RecommendationResult[]> {
  if (gifts.length === 0) {
    return [];
  }

  // 最大5つまでに制限
  const selectedGifts = gifts.slice(0, 5);

  const familySizeText = {
    'single': '一人暮らし',
    'couple': '夫婦・カップル',
    'small_family': '3-4人家族',
    'large_family': '5人以上の家族'
  }[request.familySize];

  const categoriesText = request.categories.length > 0 
    ? request.categories.map(cat => {
        const categoryNames = {
          'meat': '肉類', 'seafood': '魚介類', 'fruit': '果物', 'vegetable': '野菜',
          'rice': '米・穀物', 'dairy': '乳製品', 'alcohol': 'お酒', 'sweets': 'スイーツ',
          'processed': '加工品', 'set': 'セット・詰合せ'
        };
        return categoryNames[cat] || cat;
      }).join('、')
    : '指定なし';

  const allergiesText = request.allergies.length > 0
    ? request.allergies.map(allergy => {
        const allergyNames = {
          'egg': '卵', 'milk': '乳', 'wheat': '小麦', 'buckwheat': 'そば',
          'peanut': '落花生', 'shrimp': 'えび', 'crab': 'かに', 'orange': 'オレンジ',
          'kiwi': 'キウイフルーツ', 'peach': 'もも', 'apple': 'りんご', 'banana': 'バナナ'
        };
        return allergyNames[allergy] || allergy;
      }).join('、')
    : 'なし';

  const prompt = `
あなたは関西弁を話すまんぷくんという、ふるさと納税の返礼品推薦の専門家です。
ユーザーの条件に基づいて、以下の返礼品の中から最適なものを推薦してください。

【ユーザー条件】
- 予算: ${request.budget.min.toLocaleString()}円 ～ ${request.budget.max.toLocaleString()}円
- 家族構成: ${familySizeText}
- 希望カテゴリ: ${categoriesText}
- アレルギー: ${allergiesText}
- 特別なリクエスト: ${request.specialRequests || 'なし'}

【返礼品データ】
${selectedGifts.map((gift, index) => `
${index + 1}. ${gift.name}
   - 寄付金額: ${gift.donation_amount.toLocaleString()}円
   - カテゴリ: ${gift.category || '未分類'}
   - 容量: ${gift.capacity_weight || '記載なし'}
   - 配送: ${[
     gift.temp_shipping && '常温',
     gift.cold_shipping && '冷蔵', 
     gift.frozen_shipping && '冷凍'
   ].filter(Boolean).join('・')}
   - 発送目安: ${gift.shipping_estimate || '記載なし'}
   - 説明: ${gift.description || '詳細なし'}
`).join('\n')}

以下のJSON形式で、推薦度の高い順に3つまでの商品について回答してください：

{
  "recommendations": [
    {
      "giftIndex": 商品番号(1-${selectedGifts.length}),
      "rating": 評価(1-5の整数),
      "reason": "推薦理由（100文字程度、まんぷくんの関西弁で）",
      "manpukunComment": "まんぷくんからのひとこと（50文字程度、親しみやすく）",
      "pros": ["メリット1", "メリット2", "メリット3"],
      "cons": ["注意点1", "注意点2"] // ある場合のみ
    }
  ]
}

まんぷくんの特徴：
- 関西弁で話す（「〜やで」「〜やん」「ええで〜」など）
- 食べ物に詳しく、美味しさを伝えるのが得意
- 親しみやすく、ユーザー目線でアドバイス
- 家族構成や予算を考慮した実用的な提案
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "あなたは関西弁を話すまんぷくんというキャラクターです。ふるさと納税の返礼品について、親しみやすく実用的なアドバイスをします。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('ChatGPTからの応答が空です');
    }

    const parsedResponse = JSON.parse(responseText);
    
    // 結果を変換
    const results: RecommendationResult[] = parsedResponse.recommendations.map((rec: any) => {
      const giftIndex = rec.giftIndex - 1; // 0ベースに変換
      const gift = selectedGifts[giftIndex];
      
      if (!gift) {
        throw new Error(`無効な商品インデックス: ${rec.giftIndex}`);
      }

      return {
        gift,
        rating: Math.min(Math.max(rec.rating, 1), 5), // 1-5の範囲に制限
        reason: rec.reason,
        manpukunComment: rec.manpukunComment,
        pros: rec.pros || [],
        cons: rec.cons || []
      };
    });

    return results;

  } catch (error) {
    console.error('ChatGPT API エラー:', error);
    
    // フォールバック：シンプルな推薦を生成
    return selectedGifts.slice(0, 3).map((gift, index) => ({
      gift,
      rating: 4,
      reason: `${familySizeText}にぴったりの商品やで〜！予算内でええもん見つかったで！`,
      manpukunComment: `これはおすすめやで〜！`,
      pros: [
        '予算内でお得',
        '品質が良い',
        '満足度が高い'
      ],
      cons: []
    }));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: RecommendationRequest = await request.json();

    // バリデーション
    if (!body.budget || body.budget.min < 0 || body.budget.max < body.budget.min) {
      return NextResponse.json<APIResponse>({
        success: false,
        message: '予算設定が無効です。'
      }, { status: 400 });
    }

    if (!body.familySize) {
      return NextResponse.json<APIResponse>({
        success: false,
        message: '家族構成を選択してください。'
      }, { status: 400 });
    }

    // 返礼品をフィルタリング
    const filteredGifts = await filterReturnGifts(body);

    if (filteredGifts.length === 0) {
      return NextResponse.json<APIResponse>({
        success: true,
        message: '条件に合う返礼品が見つかりませんでした。条件を変更してお試しください。',
        data: {
          recommendations: []
        }
      });
    }

    // ChatGPTで推薦を生成
    const recommendations = await generateRecommendations(filteredGifts, body);

    return NextResponse.json<APIResponse>({
      success: true,
      message: `${recommendations.length}件のおすすめ返礼品が見つかりました。`,
      data: {
        recommendations,
        totalFound: filteredGifts.length
      }
    });

  } catch (error) {
    console.error('推薦API エラー:', error);
    return NextResponse.json<APIResponse>({
      success: false,
      message: 'サーバーエラーが発生しました。しばらくしてからお試しください。'
    }, { status: 500 });
  }
}
