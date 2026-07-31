import os
import shutil
import struct

source_png = r"C:\Users\amays\.gemini\antigravity-ide\brain\777eae68-095a-4f60-8a7c-b98a710abdfc\noa_app_icon_1785487165280.png"
target_dir = r"d:\Github\ai-engine\desktop-windows\src-tauri\icons"

os.makedirs(target_dir, exist_ok=True)

# Copy PNGs
shutil.copy(source_png, os.path.join(target_dir, "32x32.png"))
shutil.copy(source_png, os.path.join(target_dir, "128x128.png"))
shutil.copy(source_png, os.path.join(target_dir, "128x128@2x.png"))
shutil.copy(source_png, os.path.join(target_dir, "icon.icns"))

# Read PNG data
with open(source_png, "rb") as f:
    png_data = f.read()

# Build Windows .ico containing PNG payload
header = struct.pack("<HHH", 0, 1, 1) # Reserved, Type=1(ICO), Count=1
entry = struct.pack("<BBBBHHII", 0, 0, 0, 0, 1, 32, len(png_data), 22) # 256x256, 32bpp, size, offset=22

ico_path = os.path.join(target_dir, "icon.ico")
with open(ico_path, "wb") as f:
    f.write(header + entry + png_data)

print(f"Created icons in {target_dir} successfully. ICO size: {os.path.getsize(ico_path)} bytes")
