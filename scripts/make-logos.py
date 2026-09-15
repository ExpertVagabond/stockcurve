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
    m["image"] = RAW + os.path.basename(out)
    json.dump(m, open(path, "w"), indent=2)
    print(out, "→", m["image"])
