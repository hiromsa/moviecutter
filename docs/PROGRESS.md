# 開発進捗記録 (PROGRESS.md)

## 現在のステータス
- **バージョン**: `v0.0.1-beta.6+394dd20`
- **フェーズ**: 切り取り時間直接入力・時間ロックモード（範囲スライド移動）実装完了

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
- [x] **切り取り時間（長さ）の直接入力機能**:
  - コントロールバー右下に「長さ」入力欄を新設
  - 入力すると現在の開始点(In)を維持したまま終了点(Out)が自動計算・反映
- [x] **時間ロック（Duration Lock）モード & 範囲スライド移動**:
  - ロック切り替えボタン（鍵アイコン）を新設
  - タイムライン上の選択範囲ハイライトをドラッグして範囲全体を左右にスライド移動可能
  - ロックON時は切り取り時間を固定したまま、トラックのドラッグやIn/Outハンドル操作でも範囲全体が連動スライド
  - ロック時はUIおよびタイムラインハイライトがエメラルドストライプに発光変化
- [x] ビルド検証 (`npm run build` 成功)

## 次の予定
- [ ] ユーザーによる動作確認と追加フィードバックの反映
