import os
import hashlib
import json

release_assets = r"d:\Github\ai-engine\release-assets"
apk_path = os.path.join(release_assets, "Noa-v2.2.0-Android-arm64.apk")
exe_path = os.path.join(release_assets, "Noa-v2.2.0-Windows-x64-Setup.exe")

def get_sha256(filepath):
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest().upper()

apk_hash = get_sha256(apk_path)
exe_hash = get_sha256(exe_path)

metadata = {
    "android": {
        "path": apk_path,
        "sha256": apk_hash
    },
    "windows": {
        "path": exe_path,
        "sha256": exe_hash
    },
    "toolVersions": {
        "node": "v24.18.0",
        "npm": "11.16.0",
        "cargo": "cargo 1.97.1 (c980f4866 2026-06-30)",
        "java": 'openjdk version "17.0.20" 2026-07-21'
    }
}

metadata_path = os.path.join(release_assets, "build-metadata.json")
with open(metadata_path, "w", encoding="utf-8") as f:
    json.dump(metadata, f, indent=4)

print("build-metadata.json generated cleanly!")
print("Android APK SHA-256:", apk_hash)
print("Windows EXE SHA-256:", exe_hash)
