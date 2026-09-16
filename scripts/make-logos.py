#!/usr/bin/env python3
"""Generate 512x512 token logos for every meta/*.json and point each JSON's `image` at its own PNG.
Design: dark tile, a small three-segment curve glyph (thin → dense → dense, like the stockcurve
liquidity shape) with a tick at the reference line, the symbol in bold, quote symbol underneath."""
import json, glob, os
from PIL import Image, ImageDraw, ImageFont

BG, LINE, FG, MUTE, ACC = (11, 13, 16), (31, 38, 48), (230, 233, 238), (138, 148, 163), (122, 162, 255)
RAW = "https://raw.githubusercontent.com/ExpertVagabond/stockcurve/main/meta/"
bold = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 92, index=1)
small = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 34)
mono = ImageFont.truetype("/System/Library/Fonts/SFNSMono.ttf", 26)

for path in sorted(glob.glob("meta/*.json")):
    m = json.load(open(path))
    sym = m["symbol"]
    quote = next((a["value"] for a in m.get("attributes", []) if a["trait_type"] == "quote"), "")
    img = Image.new("RGB", (512, 512), BG)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((16, 16, 496, 496), radius=48, fill=(18, 22, 27), outline=LINE, width=3)
    # curve glyph: three segments rising to a graduation line; segment thickness = liquidity weight
    x0, x1, yb, yt = 96, 416, 300, 150
    xs = [x0, x0 + 80, x0 + 200, x1]
    ys = [yb, yb - 60, yb - 105, yt]
    for i, w in enumerate([4, 9, 13]):
        d.line([(xs[i], ys[i]), (xs[i + 1], ys[i + 1])], fill=ACC, width=w)
    ref_y = ys[2]
    d.line([(x0 - 20, ref_y), (x1 + 20, ref_y)], fill=MUTE, width=2)  # reference line
    d.text((x1 + 26, ref_y - 14), "ref", font=mono, fill=MUTE)
    d.line([(x1, yt - 24), (x1, yt + 24)], fill=FG, width=4)  # graduation tick
    # labels
    tw = d.textlength(sym, font=bold)
    fs = bold if tw <= 440 else ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", int(92 * 440 / tw), index=1)
    d.text((256, 372), sym, font=fs, fill=FG, anchor="mm")
    d.text((256, 440), f"stockcurve · {quote}" if quote else "stockcurve", font=small, fill=MUTE, anchor="mm")
    out = path[:-5] + ".png"
    img.save(out, optimize=True)

    # 2:3 poster for the catalogue tiles (400x600): red top rule, curve glyph, symbol, quote.
    P = Image.new("RGB", (400, 600), BG)
    pd = ImageDraw.Draw(P)
    pd.rectangle((0, 0, 400, 600), fill=(14, 14, 16))
    for y in range(600):  # subtle vertical gradient
        t = y / 600
        pd.line([(0, y), (400, y)], fill=(int(14 + 8 * t), int(14 + 8 * t), int(16 + 10 * t)))
    pd.rectangle((0, 0, 400, 6), fill=(229, 9, 20))
    x0, x1, yb, yt = 60, 340, 330, 200
    xs = [x0, x0 + 70, x0 + 175, x1]; ys = [yb, yb - 55, yb - 95, yt]
    for i, w in enumerate([4, 9, 13]):
        pd.line([(xs[i], ys[i]), (xs[i + 1], ys[i + 1])], fill=ACC, width=w)
    pd.line([(x0 - 14, ys[2]), (x1 + 14, ys[2])], fill=MUTE, width=2)
    pd.line([(x1, yt - 22), (x1, yt + 22)], fill=FG, width=4)
    pf = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 64, index=1)
    tw = pd.textlength(sym, font=pf)
    if tw > 350: pf = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", int(64 * 350 / tw), index=1)
    pd.text((200, 440), sym, font=pf, fill=FG, anchor="mm")
    pd.text((200, 500), f"quoted in {quote}" if quote else "", font=ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 24), fill=MUTE, anchor="mm")
    P.save(path[:-5] + "-poster.png", optimize=True)

    # 16:7 billboard for the hero (1600x700): big curve on the right, faint grid, dark left for text.
    B = Image.new("RGB", (1600, 700), BG)
    bd = ImageDraw.Draw(B)
    for x in range(0, 1600, 80): bd.line([(x, 0), (x, 700)], fill=(16, 17, 20), width=1)
    for y in range(0, 700, 80): bd.line([(0, y), (1600, y)], fill=(16, 17, 20), width=1)
    x0, x1, yb, yt = 760, 1480, 560, 170
    xs = [x0, x0 + 190, x0 + 470, x1]; ys = [yb, yb - 150, yb - 260, yt]
    for i, w in enumerate([8, 18, 28]):
        bd.line([(xs[i], ys[i]), (xs[i + 1], ys[i + 1])], fill=ACC, width=w)
    bd.line([(x0 - 40, ys[2]), (x1 + 40, ys[2])], fill=(70, 76, 88), width=3)
    bd.text((x1 + 52, ys[2] - 16), "reference", font=ImageFont.truetype("/System/Library/Fonts/SFNSMono.ttf", 26), fill=MUTE)
    bd.line([(x1, yt - 50), (x1, yt + 50)], fill=FG, width=8)
    bd.text((x1 - 14, yt - 96), "graduate", font=ImageFont.truetype("/System/Library/Fonts/SFNSMono.ttf", 26), fill=FG, anchor="rm")
    bd.text((x0 - 14, yb + 30), "start −15%", font=ImageFont.truetype("/System/Library/Fonts/SFNSMono.ttf", 26), fill=MUTE, anchor="lm")
    B.save(path[:-5] + "-billboard.png", optimize=True)
    if not m.get("image","").startswith("https://stockcurve."): m["image"] = RAW + os.path.basename(out)
    m["properties"] = {"files": [{"uri": m["image"], "type": "image/png"}], "category": "image"}
    json.dump(m, open(path, "w"), indent=2)
    print(out, "→", m["image"])
