# 開発進捗記録 (PROGRESS.md)

## 現在のステータス
- **バージョン**: `v0.0.1-beta.4+7224c84`
- **フェーズ**: タイムライン操作性・位置整合性の完全改善

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
- [x] **終了ポイントハンドルとキャレットの位置ズレの完全解消**:
  - `timeline-handle-out` の `transform: translateX(50%)` によるズレを修正し、中央基準 (`translateX(-50%)`) で再生ヘッドと完全に一致
- [x] **ルーラー領域（時間表示部）での独立キャレット操作**:
  - ルーラー上でのクリック＆ドラッグにより、ハンドルに干渉されず自由にキャレット（再生ヘッド）をシーク・スクラブ可能に
  - 再生ヘッドのつまみをルーラー上部まで突出
- [x] **トラック領域での直感的な範囲ドラッグ選択**:
  - マウスダウンからドラッグ（6px以上）で開始点(In)〜終了点(Out)を一発で範囲指定可能
  - クリック時（6px未満）は範囲を変更せずキャレットのみ移動
  - 従来のIn/Outハンドルによる個別微調整もそのまま併用可能
- [x] ビルド検証 (`npm run build` 成功)

## 次の予定
- [ ] ユーザーによる動作確認と追加フィードバックの反映
