from __future__ import annotations

from io import BytesIO
from PIL import Image, ImageOps


def resize_square_image(data: bytes, size: int, ext: str) -> bytes:
    with Image.open(BytesIO(data)) as img:
        if ext == ".png":
            img = img.convert("RGBA")
            fmt = "PNG"
            params = {}
        elif ext == ".webp":
            img = img.convert("RGB")
            fmt = "WEBP"
            params = {"quality": 82}
        else:
            img = img.convert("RGB")
            fmt = "JPEG"
            params = {"quality": 82, "optimize": True}

        img = ImageOps.fit(img, (size, size), method=Image.LANCZOS)

        out = BytesIO()
        img.save(out, format=fmt, **params)
        return out.getvalue()
