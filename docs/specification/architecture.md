# アーキテクチャ設計書 (Architecture Design)

## 1. 全体構成方針
- **言語・ツール**: TypeScript, HTML5, Vanilla CSS, Vite
- **オブジェクト指向 & 疎結合**:
  - UIコンポーネントは独立し、状態は `AppState` を通じて購読（Pub/Sub イベント駆動）する。
  - 動画処理ロジック（FFmpeg操作・Blob作成・フレーム画像キャプチャ）は `src/core/` に集約し、UI層と分離する。
- **軽量・高速性**:
  - 切り取り処理には再エンコードを行わないストリームコピー (`-c copy`) を基本とし、数秒〜数十秒で瞬時に切り出し完了する。
  - プレビューは HTML5 `<video>` 要素のネイティブデコードを利用し、軽快なシークと再生を実現。

## 2. ディレクトリ構成
```
moviecutter/
├── docs/
│   ├── specification/
│   │   ├── README.md
│   │   ├── architecture.md
│   │   ├── ui.md
│   │   └── video-engine.md
│   └── PROGRESS.md
├── src/
│   ├── config/
│   │   └── version.ts      # バージョン・ビルド情報
│   ├── core/
│   │   ├── FFmpegEngine.ts # FFmpeg.wasm ラッパー
│   │   └── VideoEngine.ts  # 動画読み込み・フレームキャプチャ・メタデータ取得
│   ├── state/
│   │   └── AppState.ts     # アプリ状態・イベントディスパッチャ
│   ├── ui/
│   │   ├── Header.ts
│   │   ├── VideoPlayer.ts
│   │   ├── Timeline.ts
│   │   ├── Controls.ts
│   │   ├── ExportPanel.ts
│   │   └── StatusBar.ts
│   ├── styles/
│   │   └── main.css        # 洗練されたダークUIスタイル
│   └── main.ts             # エントリーポイント
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 3. 状態管理 (`AppState`)
- `videoFile: File | null`
- `videoUrl: string | null`
- `duration: number` (総再生時間 秒)
- `currentTime: number` (現在時間 秒)
- `startTime: number` (選択範囲 開始 秒)
- `endTime: number` (選択範囲 終了 秒)
- `isPlaying: boolean`
- `isLooping: boolean`
- `playbackRate: number`
- `ffmpegStatus: 'unloaded' | 'loading' | 'ready' | 'processing' | 'error'`
- `processingProgress: number` (0 - 100)
- `statusMessage: string`
