# ✂️ MovieCutter

> **既存動画の一部をサクサク切り取り、AIで続きの動画を即座に生成するための軽量・高速ブラウザ動画編集スタジオ**

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![FFmpeg.wasm](https://img.shields.io/badge/FFmpeg.wasm-0078D7?style=flat-square&logo=webassembly&logoColor=white)
![Version](https://img.shields.io/badge/version-v0.0.1--beta.0-emerald?style=flat-square)

---

## 🎯 開発の背景と目的
動画生成AI（Runway Gen-2/Gen-3, Luma Dream Machine, Kling, OpenAI Sora, Pika など）の普及により、「動画の続きを作りたい」「気に入ったシーンの末尾から新しい展開を生成したい」というニーズが急増しています。

従来の動画編集ソフトは起動が重く、再エンコードに時間がかかりがちです。**MovieCutter** はブラウザ上で完結し、**再エンコードなしの超高速ストリームコピー (`-c copy`)** と **ワンクリックでのラストフレームPNG抽出** により、ストレスゼロで動画の切り出しとAI生成の準備を行えます。

---

## ✨ 主な機能

- ⚡ **超高速ストリームコピー切り出し (MP4)**:
  - FFmpeg.wasm を用いて再エンコードなしで瞬時に指定区間をファイル化・保存。
- 🎬 **AI生成特化「ラストフレーム抽出」 (PNG)**:
  - 選択範囲の最後の瞬間をワンクリックで最高画質PNG保存。そのまま Image-to-Video (I2V) に投入可能。
- 📸 **現在フレームの保存 (PNG)**:
  - プレビュー中の任意フレームを高解像度画像としてキャプチャ。
- 🎞️ **ビジュアルタイムライン & サムネイルリール**:
  - 動画全体から自動生成されたサムネイルストリップ。
  - ドラッグ可能な In点 / Out点 ハンドルと再生ヘッド。
- ⏱️ **高精度なコントロール**:
  - 1フレーム単位のコマ送り・コマ戻し (`◀ 1f`, `1f ▶`)。
  - 選択範囲のループ再生 (`🔁 ループ`)。
  - 再生速度変更 (0.25x 〜 2.0x)。
  - ミリ秒精度の開始・終了時間手入力。
- ⌨️ **快適なキーボードショートカット**:
  - `Space`: 再生 / 一時停止
  - `[`: 現在位置を開始点 (In) に設定
  - `]`: 現在位置を終了点 (Out) に設定
  - `←` / `→`: 1フレーム戻る / 進む
  - `Shift` + `←` / `→`: 1秒戻る / 進む
  - `L`: 選択範囲ループ再生 ON / OFF
- 🛡️ **完全ローカル処理**:
  - 動画がサーバーに送信されることは一切なく、すべて手元のブラウザ内で安全・高速に処理されます。

---

## 🤖 おすすめのAIワークフロー

1. **MovieCutter** に元動画をドラッグ＆ドロップ。
2. タイムラインで「続きを作りたい区間」の末尾にシーク。
3. 「**🎬 選択範囲のラストフレーム (PNG)**」をクリックして保存。
4. お好みの動画生成AI（Runway, Kling, Luma 等）の **Image-to-Video** 入力にその画像をセットし、次の展開のプロンプトを入力して生成！
5. 必要に応じて前段の動画も「**✂️ 選択範囲の動画を切り取り (MP4)**」で瞬時に手元に保存。

---

## 🛠️ 開発・ビルド手順

### 必要環境
- Node.js v18 以上 (推奨: v20+)
- npm

### 開発サーバーの起動
```bash
npm install
npm run dev
```
ブラウザで `http://localhost:3000` を開きます。

### プロダクションビルド
```bash
npm run build
```
`dist/` フォルダに出力されます。GitHub Pages や任意の静的ホスティングにデプロイ可能です。

---

## 📐 アーキテクチャと仕様

- [仕様書インデックス](docs/specification/README.md)
- [アーキテクチャ設計書](docs/specification/architecture.md)
- [UI仕様書](docs/specification/ui.md)
- [動画処理仕様書](docs/specification/video-engine.md)
- [開発進捗記録](docs/PROGRESS.md)
