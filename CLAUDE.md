# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**JidaiScope (ChronosEdge)** - 日本史全時代を真比率タイムラインで表現し、ピンチズームで探索できるiOSアプリ。Expo/React Nativeで構築。

## 開発コマンド

```bash
# 開発サーバー起動
npx expo start

# プラットフォーム別
npm run ios       # iOSシミュレーター
npm run android   # Androidエミュレーター
npm run web       # Webブラウザ

# リント
npm run lint
```

## アーキテクチャ

### 技術スタック
- **フレームワーク**: Expo SDK 54 + React Native 0.81.5
- **ルーティング**: expo-router（ファイルベース、typed routes有効）
- **アニメーション**: react-native-reanimated
- **ジェスチャー**: react-native-gesture-handler
- **言語**: TypeScript（strictモード）

### 導入予定ライブラリ（docs/000-ticket-overview.md参照）
- **描画**: @shopify/react-native-skia（TimelineCanvas）
- **状態管理**: Zustand（timelineStore, searchStore, bookmarkStore, iapStore）
- **DB**: expo-sqlite
- **ハプティクス**: expo-haptics
- **課金**: react-native-iap（StoreKit 2）

### ディレクトリ構成
```
app/              # ファイルベースルーティング（expo-router）
  (tabs)/         # タブナビゲーショングループ
  _layout.tsx     # ルートレイアウト（テーマプロバイダー）
components/       # 再利用可能なUIコンポーネント
  ui/             # 基本UIプリミティブ
hooks/            # カスタムReactフック
constants/        # アプリ定数
docs/             # 機能チケット・PRD
```

### パスエイリアス
`@/*` はプロジェクトルートにマッピング（例: `@/components`, `@/hooks`）

## 機能ドキュメント

全機能は `docs/` 内の番号付きチケットで管理：
- `000-ticket-overview.md` - マスターチケット一覧・依存関係
- `001-xxx.md` 〜 `240-xxx.md` - 個別機能仕様

各チケットの構成：
1. 概要セクション
2. 受け入れ条件
3. 依存関係（ブロック/ブロックされる）
4. 実装Todoリスト
5. テスト要件

### 機能レイヤー
1. **基盤層**: Database (010), State Management (020), Design Tokens (180/190)
2. **タイムライン層**: Core Canvas (030), Zoom (040), LOD (050), Era Picker (060), Layers (070)
3. **検索・詳細層**: Search (080), Event Detail (090), Person Detail (100), Sources (110)
4. **ユーザー機能層**: Bookmarks (130), Settings (140), IAP (150), Paywall (160)

## パフォーマンス要件

- フレームレート: 60fps
- 起動時間: 2秒以内
- メモリ: 200MB以下
- コア機能は全てオフライン動作必須

## 主要コンセプト

### Level of Detail (LOD)
タイムラインは4段階のLODレベル（L0〜L3）を使用し、ズームレベルに応じて表示情報密度を動的に調整。

### レイヤーシステム
- 時代レイヤー（常時表示）
- 主要事件レイヤー（常時表示）
- 天皇/将軍/人物レイヤー（無料版で制限、Proで全表示）

### ハプティクスフィードバック
発火タイミング: 時代境界通過、LOD切替、ズームレベル変更
