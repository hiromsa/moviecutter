# 開発進捗記録 (PROGRESS.md)

## 現在のステータス
- **バージョン**: `v0.0.1-beta.1+init`
- **フェーズ**: 初回コア機能・UI実装完了

## 完了した作業
- [x] プロジェクト初期化・Git設定 (`https://github.com/hiromsa/moviecutter`)
- [x] 仕様書作成 (`docs/specification/README.md`, `ui.md`, `architecture.md`, `video-engine.md`)
- [x] `.clinerules` に基づくルール・バージョン番号運用方針の確認
- [x] Vite + TypeScript 開発環境のセットアップ (`package.json`, `tsconfig.json`, `vite.config.ts`)
- [x] バージョン管理モジュール (`src/config/version.ts`) の作成
- [x] アプリケーション状態管理 (`src/state/AppState.ts`) の実装 (Pub/Sub イベント駆動)
- [x] FFmpeg.wasm エンジンラッパー (`src/core/FFmpegEngine.ts`) による高速ストリームコピー切り出し (`-c copy`)
- [x] 動画メタデータ取得・サムネイルリール生成・フレーム抽出 (`src/core/VideoEngine.ts`)
- [x] UIコンポーネント実装:
  - `Header`: タイトル、バージョンバッジ、ガイドボタン、ファイル選択
  - `VideoPlayer`: HUDオーバーレイ、ドラッグ＆ドロップ対応プレイヤー
  - `Timeline`: ルーラー、サムネイルストリップ、In/Outドラッグハンドル、再生ヘッド
  - `Controls`: コマ送り/戻し、再生/停止、In/Out設定、ループ再生、速度変更、時間入力
  - `ExportPanel`: 高速MP4切り出し、現在フレームPNG保存、AI用ラストフレームPNG抽出
  - `StatusBar`: エンジン状態インジケーター、ファイル情報、ショートカット表示
  - `HelpModal`: キーボードショートカット一覧 & AIで続きを作るためのワークフロー解説
- [x] スタイリング (`src/styles/main.css`) による洗練されたダークスタジオUI
- [x] ビルド検証 (`npm run build` 成功)

## 次の予定
- [ ] ユーザーへの動作確認と追加要望（UI調整、特定AIへの書き出しプリセット等）のヒアリング
- [ ] 必要に応じた微調整や機能追加
