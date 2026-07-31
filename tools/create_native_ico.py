import os
import struct

target_dir = r"d:\Github\ai-engine\desktop-windows\src-tauri\icons"
os.makedirs(target_dir, exist_ok=True)

width = 32
height = 32

# Create a 32x32 BGRA image (lavender orb: B=240, G=180, R=160, A=255 inside circle, B=40, G=20, R=20, A=255 outside)
bgra_pixels = bytearray()
# BMP stores pixels bottom-to-top
for y in range(height - 1, -1, -1):
    cy = y - 15.5
    for x in range(width):
        cx = x - 15.5
        dist_sq = cx*cx + cy*cy
        if dist_sq <= 144: # Inside circle
            bgra_pixels.extend([250, 180, 160, 255])
        elif dist_sq <= 196: # Glow boundary
            bgra_pixels.extend([220, 120, 100, 255])
        else: # Background
            bgra_pixels.extend([40, 20, 20, 255])

and_mask = b"\x00" * 128 # 32x32 bits / 8 = 128 bytes (all opaque)

bih_size = 40
image_data_size = bih_size + len(bgra_pixels) + len(and_mask) # 40 + 4096 + 128 = 4264

# BITMAPINFOHEADER (biHeight must be 2 * height = 64 for ICO)
bih = struct.pack(
    "<IIIHHIIIIII",
    bih_size,      # biSize
    width,         # biWidth
    height * 2,    # biHeight (double height for ICO)
    1,             # biPlanes
    32,            # biBitCount
    0,             # biCompression (BI_RGB)
    len(bgra_pixels), # biSizeImage
    0,             # biXPelsPerMeter
    0,             # biYPelsPerMeter
    0,             # biClrUsed
    0              # biClrImportant
)

ico_header = struct.pack("<HHH", 0, 1, 1) # Reserved=0, Type=1(ICO), Count=1
ico_entry = struct.pack(
    "<BBBBHHII",
    width,        # 32
    height,       # 32
    0,            # ColorCount
    0,            # Reserved
    1,            # Planes
    32,           # BitCount
    image_data_size, # BytesInRes (4264)
    22            # ImageOffset (6 + 16 = 22)
)

ico_file_path = os.path.join(target_dir, "icon.ico")
with open(ico_file_path, "wb") as f:
    f.write(ico_header + ico_entry + bih + bgra_pixels + and_mask)

print(f"Generated native BMP DIB icon at {ico_file_path}, size: {os.path.getsize(ico_file_path)} bytes")
