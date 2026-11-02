"""Tile stills into a contact sheet with frame numbers: python3 tile.py out.png a.png b.png ..."""
import sys, os, re
from PIL import Image, ImageDraw
out, files = sys.argv[1], sys.argv[2:]
ims = [Image.open(f).convert("RGB") for f in files]
w, h = ims[0].size
cols = min(6, len(ims))
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (w + 6), rows * (h + 6)), "white")
d = ImageDraw.Draw(sheet)
for i, (im, f) in enumerate(zip(ims, files)):
    x, y = (i % cols) * (w + 6), (i // cols) * (h + 6)
    sheet.paste(im, (x, y))
    label = re.sub(r"^.*-0*(\d+)\.png$", r"\1", os.path.basename(f))
    d.rectangle([x, y, x + 46, y + 18], fill="black")
    d.text((x + 4, y + 3), label, fill="yellow")
sheet.save(out)
print("sheet:", out, sheet.size)
