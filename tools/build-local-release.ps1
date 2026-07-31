$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$repo = 'd:\Github\ai-engine'
$toolRoot = Join-Path $env:LOCALAPPDATA 'NoaBuildTools'
$jdkRoot = Join-Path $toolRoot 'temurin-17'
$sdkRoot = Join-Path $toolRoot 'android-sdk'
$rustBin = Join-Path $env:USERPROFILE '.cargo\bin'

function Assert-LastExitCode([string] $Operation) {
    if ($LASTEXITCODE -ne 0) {
        throw "$Operation failed with exit code $LASTEXITCODE."
    }
}

function Download-File([string] $Uri, [string] $Destination) {
    Invoke-WebRequest -Uri $Uri -OutFile $Destination -UseBasicParsing
    if (-not (Test-Path -LiteralPath $Destination) -or (Get-Item -LiteralPath $Destination).Length -eq 0) {
        throw "Download failed: $Uri"
    }
}

New-Item -ItemType Directory -Force -Path $toolRoot | Out-Null

if (-not (Test-Path -LiteralPath (Join-Path $jdkRoot 'bin\keytool.exe'))) {
    $jdkZip = Join-Path $toolRoot 'temurin-17.zip'
    $jdkExtract = Join-Path $toolRoot 'temurin-17-extract'
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $jdkExtract
    Download-File 'https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse?project=jdk' $jdkZip
    Expand-Archive -LiteralPath $jdkZip -DestinationPath $jdkExtract -Force
    $jdkDirectory = Get-ChildItem -LiteralPath $jdkExtract -Directory | Select-Object -First 1
    if ($null -eq $jdkDirectory -or -not (Test-Path -LiteralPath (Join-Path $jdkDirectory.FullName 'bin\keytool.exe'))) {
        throw 'The downloaded JDK archive did not contain keytool.exe.'
    }
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $jdkRoot
    Move-Item -LiteralPath $jdkDirectory.FullName -Destination $jdkRoot
}

if (-not (Test-Path -LiteralPath (Join-Path $rustBin 'cargo.exe'))) {
    $rustup = Join-Path $toolRoot 'rustup-init.exe'
    Download-File 'https://static.rust-lang.org/rustup/dist/x86_64-pc-windows-msvc/rustup-init.exe' $rustup
    & $rustup -y --profile minimal --default-toolchain stable-x86_64-pc-windows-msvc
    Assert-LastExitCode 'Rust toolchain installation'
}

$env:JAVA_HOME = $jdkRoot
$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:Path = "$(Join-Path $rustBin '');$(Join-Path $jdkRoot 'bin');$env:Path"

if (-not (Test-Path -LiteralPath (Join-Path $sdkRoot 'cmdline-tools\latest\bin\sdkmanager.bat'))) {
    $cmdlineZip = Join-Path $toolRoot 'android-commandline-tools.zip'
    $cmdlineExtract = Join-Path $toolRoot 'android-commandline-tools-extract'
    $cmdlineDestination = Join-Path $sdkRoot 'cmdline-tools\latest'
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $cmdlineExtract
    New-Item -ItemType Directory -Force -Path (Join-Path $sdkRoot 'cmdline-tools') | Out-Null
    Download-File 'https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip' $cmdlineZip
    Expand-Archive -LiteralPath $cmdlineZip -DestinationPath $cmdlineExtract -Force
    $cmdlineSource = Join-Path $cmdlineExtract 'cmdline-tools'
    if (-not (Test-Path -LiteralPath (Join-Path $cmdlineSource 'bin\sdkmanager.bat'))) {
        throw 'The downloaded Android command-line tools archive did not contain sdkmanager.bat.'
    }
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $cmdlineDestination
    Move-Item -LiteralPath $cmdlineSource -Destination $cmdlineDestination
}

$sdkManager = Join-Path $sdkRoot 'cmdline-tools\latest\bin\sdkmanager.bat'
$acceptLicenses = 1..100 | ForEach-Object { 'y' }
$acceptLicenses | & $sdkManager "--sdk_root=$sdkRoot" --licenses
Assert-LastExitCode 'Android SDK license acceptance'
& $sdkManager "--sdk_root=$sdkRoot" 'platform-tools' 'platforms;android-34' 'build-tools;34.0.0' 'ndk;26.1.10909125'
Assert-LastExitCode 'Android SDK package installation'

Set-Location $repo
& node --version
Assert-LastExitCode 'Node version check'
& npm --version
Assert-LastExitCode 'npm version check'
& cargo --version
Assert-LastExitCode 'Cargo version check'
& java -version
Assert-LastExitCode 'Java version check'

& npm ci --include=dev --include-workspace-root
Assert-LastExitCode 'npm workspace dependency recovery'

& npm run build --workspace @noa/api-client
Assert-LastExitCode 'Shared API client build'

$androidDirectory = Join-Path $repo 'mobile\android'
$keystore = Join-Path $androidDirectory 'noa-release.jks'
$signingProperties = Join-Path $androidDirectory 'noa-release.local.properties'
if ((Test-Path -LiteralPath $keystore) -xor (Test-Path -LiteralPath $signingProperties)) {
    throw 'Found incomplete local signing material. Refusing to overwrite the persistent keystore or credentials file.'
}

if (-not (Test-Path -LiteralPath $keystore)) {
    $randomBytes = New-Object byte[] 48
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($randomBytes)
    $signingPassword = [Convert]::ToHexString($randomBytes)
    & keytool -genkeypair -storetype JKS -keystore $keystore -storepass $signingPassword -keypass $signingPassword -alias noa-release -keyalg RSA -keysize 4096 -validity 9125 -dname 'CN=Noa Release, O=Noa, C=US' -noprompt
    Assert-LastExitCode 'Release keystore generation'
    @(
        "NOA_ANDROID_KEYSTORE_PATH=$keystore"
        "NOA_ANDROID_KEYSTORE_PASSWORD=$signingPassword"
        'NOA_ANDROID_KEY_ALIAS=noa-release'
        "NOA_ANDROID_KEY_PASSWORD=$signingPassword"
    ) | Set-Content -LiteralPath $signingProperties -Encoding ascii
}

$signing = @{}
foreach ($line in Get-Content -LiteralPath $signingProperties) {
    if ($line -match '^([^=]+)=(.*)$') {
        $signing[$matches[1]] = $matches[2]
    }
}
foreach ($required in 'NOA_ANDROID_KEYSTORE_PATH', 'NOA_ANDROID_KEYSTORE_PASSWORD', 'NOA_ANDROID_KEY_ALIAS', 'NOA_ANDROID_KEY_PASSWORD') {
    if (-not $signing.ContainsKey($required) -or [string]::IsNullOrWhiteSpace($signing[$required])) {
        throw "Missing $required in local signing material."
    }
}
$env:NOA_ANDROID_KEYSTORE_PATH = $signing['NOA_ANDROID_KEYSTORE_PATH']
$env:NOA_ANDROID_KEYSTORE_PASSWORD = $signing['NOA_ANDROID_KEYSTORE_PASSWORD']
$env:NOA_ANDROID_KEY_ALIAS = $signing['NOA_ANDROID_KEY_ALIAS']
$env:NOA_ANDROID_KEY_PASSWORD = $signing['NOA_ANDROID_KEY_PASSWORD']

Push-Location $androidDirectory
try {
    & .\gradlew.bat :app:assembleRelease --no-daemon
    Assert-LastExitCode 'Signed Android release build'
}
finally {
    Pop-Location
}

& npm run desktop:build
Assert-LastExitCode 'Tauri NSIS installer build'

$apk = Join-Path $repo 'mobile\android\app\build\outputs\apk\release\app-release.apk'
$nsisDirectory = Join-Path $repo 'desktop-windows\src-tauri\target\release\bundle\nsis'
$installer = Get-ChildItem -LiteralPath $nsisDirectory -Filter '*-setup.exe' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not (Test-Path -LiteralPath $apk)) {
    throw 'Android build completed without app-release.apk.'
}
if ($null -eq $installer) {
    throw 'Tauri build completed without an NSIS setup executable.'
}

$releaseAssets = Join-Path $repo 'release-assets'
New-Item -ItemType Directory -Force -Path $releaseAssets | Out-Null
$stagedApk = Join-Path $releaseAssets 'Noa-v2.2.0-Android-arm64.apk'
$stagedInstaller = Join-Path $releaseAssets 'Noa-v2.2.0-Windows-x64-Setup.exe'
Copy-Item -LiteralPath $apk -Destination $stagedApk -Force
Copy-Item -LiteralPath $installer.FullName -Destination $stagedInstaller -Force

$metadata = [ordered]@{
    android = [ordered]@{
        path = $stagedApk
        sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $stagedApk).Hash
    }
    windows = [ordered]@{
        path = $stagedInstaller
        sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $stagedInstaller).Hash
    }
    toolVersions = [ordered]@{
        node = (& node --version | Out-String).Trim()
        npm = (& npm --version | Out-String).Trim()
        cargo = (& cargo --version | Out-String).Trim()
        java = & {
            $tmp = Join-Path $env:TEMP 'noa_java_ver.txt'
            $p = Start-Process -FilePath 'java' -ArgumentList '-version' -NoNewWindow -RedirectStandardError $tmp -Wait -PassThru
            if (Test-Path -LiteralPath $tmp) {
                $line = (Get-Content -LiteralPath $tmp | Select-Object -First 1).Trim()
                Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
                $line
            } else { 'OpenJDK 17' }
        }
    }
}
$metadata | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $releaseAssets 'build-metadata.json') -Encoding utf8
Write-Output 'LOCAL_RELEASE_BUILD_SUCCEEDED'
