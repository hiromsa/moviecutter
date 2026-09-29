# 開発進捗記録 (PROGRESS.md)

## 現在のステータス
- **バージョン**: `v0.0.1-beta.10+568ae8f`
- **フェーズ**: 映像・音声トラックの上下セパレート分離（視認性向上）完了

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
- [x] タイムラインズーム機能 (1.0x〜10.0x, Alt+ホイール, 横スクロール, 目盛り細分化, 自動追従)
- [x] キャレット（再生ヘッド）の In点 / Out点 ジャンプ機能 (`I`/`Home`, `O`/`End` ショートカット)
- [x] ファイル保存先ダイアログ (`showSaveFilePicker`) と `.mp4` / `.png` 拡張子の保証
- [x] モダンデザイン & ベクターアイコンシステムの全面刷新 (Lucide SVG, Outfit / Plus Jakarta Sans)
- [x] 終了ポイントハンドルとキャレットの位置ズレの完全解消 (`transform: translateX(-50%)`)
- [x] キャレット直上からの範囲選択ドラッグの改善（ルーラーとトラックの明確な役割分担）
- [x] 画像のクリップボードコピー機能の実装（現在フレーム / ラストフレーム）
- [x] 切り取り時間（長さ）の直接入力機能 & 時間ロック（Duration Lock）モードによる範囲スライド移動
- [x] デフォルト開始・終了なし（範囲未選択）への改修 & クイック秒数選択 (3s/5s) & 選択クリア機能 (Esc)
- [x] 選択範囲の音声抽出機能の実装 (MP3 / WAV)
- [x] タイムライン音声波形（オーディオウェーブフォーム）表示の実装 (Web Audio API)
- [x] **映像トラックと音声トラックの上下2段セパレート化（視認性改善）**:
  - トラック領域を上段（映像サムネイル・54px）と下段（音声波形・42px）に完全に上下分割
  - 映像サムネイルが波形に被らずクッキリ鮮明に確認可能
  - 音声波形も専用ダーク背景上で上下対称のネオンシアン波形として明瞭表示
  - 選択範囲ハイライトやハンドル・再生ヘッドは上下トラックを一体で跨ぎ、従来の快適な操作感を維持
- [x] ビルド検証 (`npm run build` 成功)

## 次の予定
- [ ] ユーザーによる動作確認と追加フィードバックの反映
