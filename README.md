# まん福返礼品推薦システム 🍙

まんぷくんがユーザーの条件に基づいて最適なふるさと納税返礼品をおすすめしてくれるシステムです。

## 🚀 主な機能

- **管理画面**: CSVファイルアップロードによる返礼品データ管理
- **ユーザー推薦画面**: 条件入力とAIによる返礼品推薦
- **まんぷくんチャット**: 関西弁で親しみやすい推薦表示
- **ChatGPT連携**: AI による理由付き推薦

## 🛠 技術スタック

- **フロントエンド**: Next.js 14 (App Router), React, Tailwind CSS
- **バックエンド**: Next.js API Routes
- **データベース**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4
- **デプロイ**: Vercel
- **ファイル処理**: Papa Parse

## 📦 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成し、以下の環境変数を設定してください：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key
```

### 3. Supabase データベースセットアップ

Supabase のSQL エディタで以下のテーブルを作成してください：

```sql
-- 返礼品テーブル
CREATE TABLE return_gifts (
  id SERIAL PRIMARY KEY,
  gift_id VARCHAR(50) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  donation_amount INTEGER NOT NULL,
  stock_quantity INTEGER,
  capacity_weight TEXT,
  provider_info TEXT,
  shipping_estimate TEXT,
  notes TEXT,
  is_public BOOLEAN DEFAULT true,
  temp_shipping BOOLEAN DEFAULT false,
  cold_shipping BOOLEAN DEFAULT false,
  frozen_shipping BOOLEAN DEFAULT false,
  regular_delivery BOOLEAN DEFAULT false,
  date_specified_delivery BOOLEAN DEFAULT false,
  split_delivery BOOLEAN DEFAULT false,
  simple_packaging BOOLEAN DEFAULT false,
  noshi_support BOOLEAN DEFAULT false,
  municipality_code VARCHAR(50),
  expiry_storage TEXT,
  allergens TEXT,
  allergen_notes TEXT,
  category TEXT,
  linked_service TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- CSV アップロード履歴テーブル
CREATE TABLE csv_uploads (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  upload_date TIMESTAMP DEFAULT NOW(),
  record_count INTEGER,
  status VARCHAR(50) DEFAULT 'processing'
);
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

## 📁 プロジェクト構造

```
manpuku-recommend/
├── app/
│   ├── admin/                  # 管理画面
│   ├── recommend/              # ユーザー推薦画面
│   ├── api/                    # API エンドポイント
│   │   ├── upload-csv/
│   │   └── recommend/
│   └── components/             # React コンポーネント
│       ├── admin/
│       └── recommend/
├── lib/                        # ユーティリティ
├── types/                      # TypeScript 型定義
└── public/                     # 静的ファイル
```

## 🎯 使用方法

### 管理者向け

1. `/admin` にアクセス
2. 返礼品データのCSVファイルをアップロード
3. データが正常に登録されたことを確認

### ユーザー向け

1. `/recommend` にアクセス
2. 予算、カテゴリ、家族構成、アレルギー情報などを入力
3. まんぷくんがおすすめの返礼品を提案
4. 気に入った商品の詳細を確認

## 📊 CSV ファイル形式

アップロードするCSVファイルは以下の形式である必要があります：

| カラム名 | 必須 | 説明 |
|---------|------|------|
| 返礼品ID | ✓ | 一意識別子 |
| 返礼品名 | ✓ | 商品名 |
| 寄付金額 | ✓ | 寄付金額（数値） |
| カテゴリ | | 商品カテゴリ |
| アレルギー | | アレルギー情報 |
| 常温配送対応フラグ | | 0または1 |
| 冷蔵配送対応フラグ | | 0または1 |
| 冷凍配送対応フラグ | | 0または1 |

その他のカラムについては `types/index.ts` を参照してください。

## 🚀 デプロイ

### Vercel デプロイ

1. GitHub リポジトリを作成してコードをプッシュ
2. Vercel でプロジェクトをインポート
3. 環境変数を設定
4. 自動デプロイを確認

### 環境変数（本番環境）

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

## 🎨 カスタマイズ

### まんぷくんキャラクター

`public/manpukun/` ディレクトリに画像ファイルを配置することで、まんぷくんの表情やポーズを追加できます：

- `happy.png` - 通常の笑顔
- `thinking.png` - 考え中
- `excited.png` - 興奮
- `recommending.png` - おすすめ中
- `surprised.png` - 驚き

### カテゴリ・アレルギー項目

`app/api/recommend/route.ts` の `categoryMapping` と `allergyMapping` を編集することで、検索条件をカスタマイズできます。

## 🔧 開発者向け情報

### API エンドポイント

- `POST /api/upload-csv` - CSV ファイルアップロード
- `POST /api/recommend` - 返礼品推薦

### 型定義

すべての型定義は `types/index.ts` に集約されています。

### スタイリング

Tailwind CSS を使用しています。カスタムスタイルは `app/globals.css` に追加してください。

## 📝 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成

## 📞 サポート

質問や問題がある場合は、Issue を作成してください。

---

🍙 まんぷくんと一緒に、素晴らしいふるさと納税体験を提供しましょう！
