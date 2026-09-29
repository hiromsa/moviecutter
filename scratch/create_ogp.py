import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

src_path = r"C:\Users\sato\.gemini\antigravity-ide\brain\5c26020a-fe40-4561-8b66-a5efcfcf8f96\.user_uploaded\media_1790680049515.png"
out_path = r"c:\tools\moviecutter\public\ogp.jpg"

W, H = 1200, 630
base = Image.open(src_path).convert("RGBA")

# 1. 背景の作成: 本物のアプリ画面を 1200x630 にフィット
scale = W / base.width
scaled_h = int(base.height * scale)
base_scaled = base.resize((W, scaled_h), Image.Resampling.LANCZOS)

# プレビュー画像とタイムライン波形がしっかり入るオフセット
crop_y = 50
bg = base_scaled.crop((0, crop_y, W, crop_y + H))

# コントラストと彩度を調整（暗すぎず、UIのカッコよさが伝わるバランス）
enhancer = ImageEnhance.Brightness(bg)
bg_toned = enhancer.enhance(0.70)

# 周辺減光（ビネット）
vignette = Image.new("RGBA", (W, H), (0, 0, 0, 0))
draw_v = ImageDraw.Draw(vignette)
for y in range(H):
    dy = abs(y - H / 2) / (H / 2)
    alpha = int(30 + (dy ** 2) * 170)
    draw_v.line([(0, y), (W, y)], fill=(6, 10, 20, alpha))

for x in range(W):
    dx = abs(x - W / 2) / (W / 2)
    if dx > 0.45:
        alpha = int(((dx - 0.45) / 0.55) ** 1.6 * 150)
        draw_v.line([(x, 0), (x, H)], fill=(6, 10, 20, alpha))

canvas = Image.alpha_composite(bg_toned, vignette)

# 2. 中央のプレミアムブランドカード（深みのあるソリッドダーク）
card_w = 940
card_h = 246
card_x = (W - card_w) // 2
card_y = (H - card_h) // 2 - 5

card_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
draw_card = ImageDraw.Draw(card_layer)

# ネオンシアングロー（外光発光）
for r in range(26, 0, -3):
    a = int((30 - r) * 2.8)
    draw_card.rounded_rectangle(
        [card_x - r, card_y - r, card_x + card_w + r, card_y + card_h + r],
        radius=28,
        fill=(6, 182, 212, a)
    )

# カード本体（完全不透明ソリッドダーク + 繊細なグラデーション）
draw_card.rounded_rectangle(
    [card_x, card_y, card_x + card_w, card_y + card_h],
    radius=22,
    fill=(10, 15, 29, 255),
    outline=(6, 182, 212, 240),
    width=2
)

# カード上部の微細な発光アクセントライン
draw_card.line([card_x + 30, card_y + 1, card_x + card_w - 30, card_y + 1], fill=(56, 189, 248, 255), width=2)

# フォント設定
font_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 62)
font_sub = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 21)
font_badge = ImageFont.truetype("C:/Windows/Fonts/meiryo.ttc", 15)
font_feature = ImageFont.truetype("C:/Windows/Fonts/meiryo.ttc", 17)
font_desc = ImageFont.truetype("C:/Windows/Fonts/meiryo.ttc", 17)

# ハサミのスタイリッシュなベクターアイコン
ix = card_x + 48
iy = card_y + 36
# 刃先（シアン）
draw_card.line([(ix + 12, iy + 40), (ix + 46, iy + 6)], fill=(6, 182, 212), width=4)
draw_card.line([(ix + 38, iy + 40), (ix + 4, iy + 6)], fill=(6, 182, 212), width=4)
# ハンドルループ
draw_card.ellipse([ix + 2, iy + 36, ix + 24, iy + 58], outline=(6, 182, 212), width=4)
draw_card.ellipse([ix + 26, iy + 36, ix + 48, iy + 58], outline=(6, 182, 212), width=4)
# 接合部ピン
draw_card.ellipse([ix + 22, iy + 28, ix + 28, iy + 34], fill=(255, 255, 255))

# メインロゴタイトル "MovieCutter"
title_x = card_x + 116
title_y = card_y + 22
# 影
draw_card.text((title_x + 2, title_y + 2), "MovieCutter", font=font_title, fill=(0, 0, 0, 180))
# 本体
draw_card.text((title_x, title_y), "MovieCutter", font=font_title, fill=(255, 255, 255, 255))

# サブタイトル
sub_x = title_x + 385
sub_y = title_y + 28
draw_card.text((sub_x, sub_y), "AI-Powered Video Clip & Frame Studio", font=font_sub, fill=(56, 189, 248, 240))

# 区切り線
draw_card.line([card_x + 44, card_y + 110, card_x + card_w - 44, card_y + 110], fill=(255, 255, 255, 35), width=1)

# セキュリティバッジ
bx = card_x + 48
by = card_y + 126
bw = 450
bh = 36
draw_card.rounded_rectangle([bx, by, bx + bw, by + bh], radius=18, fill=(10, 32, 26, 255), outline=(52, 211, 153, 200), width=1)

# シールドアイコン描画
sx, sy = bx + 16, by + 10
draw_card.polygon([(sx + 6, sy), (sx + 13, sy + 3), (sx + 13, sy + 10), (sx + 6, sy + 16), (sx, sy + 10), (sx, sy + 3)], outline=(52, 211, 153), fill=(16, 185, 129))
draw_card.line([(sx + 3, sy + 8), (sx + 6, sy + 11), (sx + 10, sy + 5)], fill=(255, 255, 255), width=2)
draw_card.text((bx + 38, by + 6), "完全ローカル処理（情報収集ゼロ・サーバー送信なし）", font=font_badge, fill=(52, 211, 153, 255))

# 機能特長タグ
fx = bx + bw + 24
fy = by + 6
draw_card.text((fx, fy), "再エンコードなし瞬時カット  /  音声+静止画動画化", font=font_feature, fill=(241, 245, 249, 240))

# 下部サブタグライン
desc_y = card_y + 184
desc_text = "ブラウザ完結の超高速切り出し ＆ AI動画生成用ラストフレーム抽出スタジオ"
bbox_d = draw_card.textbbox((0, 0), desc_text, font=font_desc)
desc_w = bbox_d[2] - bbox_d[0]
draw_card.text(((W - desc_w) // 2, desc_y), desc_text, font=font_desc, fill=(148, 163, 184, 240))

# 合成
final = Image.alpha_composite(canvas, card_layer)
final_rgb = final.convert("RGB")
final_rgb.save(out_path, "JPEG", quality=95)
print(f"Generated OGP saved to {out_path}")
