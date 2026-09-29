# 開発進捗記録 (PROGRESS.md)

## 現在のステータス
- **バージョン**: `v0.0.1-beta.2+4c75cef`
- **フェーズ**: タイムライン操作性向上・エクスポート強化

## 完了した作業
- [x] プロジェクト初期化・Git設定 (`https://github.com/hiromsa/moviecutter`)
- [x] 仕様書作成 (`docs/specification/README.md`, `ui.md`, `architecture.md`, `video-engine.md`)
- [x] `.clinerules` に基づくルール・バージョン番号運用方針の確認
- [x] Vite + TypeScript 開発環境のセットアップ (`package.json`, `tsconfig.json`, `vite.config.ts`)
- [x] バージョン管理モジュール (`src/config/version.ts`) の作成
- [x] アプリケーション状態管理 (`src/state/AppState.ts`) の実装 (Pub/Sub イベント駆動)
- [x] FFmpeg.wasm エンジンラッパー (`src/core/FFmpegEngine.ts`) による高速ストリームコピー切り出し (`-c copy`)
- [x] 動画メタデータ取得・サムネイルリール生成・フレーム抽出 (`src/core/VideoEngine.ts`)
- [x] UIコンポーネント実装 (Header, VideoPlayer, Timeline, Controls, ExportPanel, StatusBar, HelpModal)
- [x] スタイリング (`src/styles/main.css`) による洗練されたダークスタジオUI
- [x] **タイムラインズーム機能の実装**:
  - 1.0x 〜 10.0x のズームスライダー & 拡大/縮小/等倍リセットボタン
  - `Alt + マウスホイール` によるスムーズなズームイン/アウト
  - 横スクロールコンテナ化、ズーム時の高精細目盛りルーラー
  - 再生ヘッドの画面外はみ出し防止・自動スクロール追従
- [x] **キャレット（再生ヘッド）の In点 / Out点 ジャンプ機能の実装**:
  - タイムラインツールバーおよびコントロールバーへの「⏮️ In点へ移動」「Out点へ移動 ⏭️」ボタン設置
  - キーボードショートカット (`I`/`Home`, `O`/`End`) 対応
- [x] **ファイルの保存先と拡張子の改善**:
  - 出力ファイル名に `.mp4` / `.png` 拡張子を確実に付与
  - `showSaveFilePicker` (名前を付けて保存ダイアログ) 対応により、ユーザーが保存先フォルダとファイル名を確認・選択可能に
  - 非対応環境での「ダウンロード」フォルダへの自動保存フォールバックと完了トースト通知
- [x] ビルド検証 (`npm run build` 成功)

## 次の予定
- [ ] ユーザーによる動作確認と追加フィードバックの反映
