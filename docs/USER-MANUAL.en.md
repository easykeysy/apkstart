# ApkStart User Manual & Troubleshooting

> Version: v0.6.3 · Platform: Windows 10/11 x64 · Updated: 2026-11-19
>
> ApkStart runs Android apps on Windows: **Android apps install like native Windows software, appear on the desktop, and open with a double-click.**
> This manual shows how to use the app first, then gives step-by-step fixes for each symptom. Every step maps to a button or menu that really exists.

---

## Contents

1. [ApkStart in 30 seconds](#1-apkstart-in-30-seconds)
2. [Install and first start](#2-install-and-first-start)
3. [Everyday use](#3-everyday-use)
4. [Three core concepts (the key to reading errors)](#4-three-core-concepts-the-key-to-reading-errors)
5. [First step when something is wrong: health check and automatic detection](#5-first-step-when-something-is-wrong-health-check-and-automatic-detection)
6. [Troubleshooting](#6-troubleshooting)
   - [6.1 "Hardware acceleration is off" / slow boot](#61-hardware-acceleration-is-off--slow-boot)
   - [6.2 Installation failed (INSTALL_FAILED_*)](#62-installation-failed-install_failed_)
   - [6.3 No ARM translation layer / ARM apps will not install or crash](#63-no-arm-translation-layer--arm-apps-will-not-install-or-crash)
   - [6.4 adb not authorised (Allow USB debugging)](#64-adb-not-authorised-allow-usb-debugging)
   - [6.5 Icon does nothing / endless spinner / window with a rotate button](#65-icon-does-nothing--endless-spinner--window-with-a-rotate-button)
   - [6.6 Other launch issues at a glance](#66-other-launch-issues-at-a-glance)
   - [6.7 No app audio / audio too quiet](#67-no-app-audio--audio-too-quiet)
   - [6.8 Store build fails to start / 0xC0000135 (DLL load failure)](#68-store-build-fails-to-start--0xc0000135-dll-load-failure)
7. [Command line reference](#7-command-line-reference)
8. [Data and folders](#8-data-and-folders)
9. [Help and feedback](#9-help-and-feedback)

---

## 1. ApkStart in 30 seconds

```
Desktop icon (real app icon, .lnk)
      │ double-click
      ▼
ApkStart.exe --launch <package>
      │ runtime not running? → start it automatically (Android 14 emulator, bundled or downloaded once)
      ▼
Open the launcher activity the system resolves (not a hard-coded main activity)
      ▼
Emulator window = app window (own title, own icon, portrait ratio, fullscreen and centred)
```

**What makes it different**

- 🖱️ **Double-click an .apk to install**: with the file association registered, double-clicking an APK parses it, installs it and creates a desktop icon.
- 🧩 **One desktop icon per app**: the icon is extracted from the APK offline; double-clicking it goes straight into the app.
- 🪟 **An app is a window**: rendered natively, fullscreen fills the screen height and centres, windowed mode can be dragged and resized, and each app remembers its own size.
- 🔍 **Findable from Windows**: shortcuts in both the desktop and the Start menu (`Programs\ApkStart\`).
- 📁 **Shared files**: `%USERPROFILE%\ApkStartShared` ↔ `/sdcard/ApkStartShared` inside Android, synced both ways.
- 🪶 **Self-contained runtime**: no dependency on MuMu, LDPlayer, WSA or any other emulator you may have installed.

> Note: this is an early-stage project maintained in the author's spare time, open source, free and ad-free. Problems are expected; this manual exists for them.

---

## 2. Install and first start

### 2.1 Pick the build that fits you

Both mirrors carry the same files; inside mainland China Gitee is much faster:

- GitHub: `github.com/RoutineMiku/apkstart/releases`
- Gitee: `gitee.com/daily-miku/apkstart/releases`

| Build | File name | When to choose it |
|---|---|---|
| **Store build** | `ApkStart_<four-part version>_x64.msix` | Installed from Microsoft Store. Full runtime included, works offline after install, updates handled by the Store |
| **Full portable** | `ApkStart-v*-win64-full.zip` (~830 MB, ~1.3 GB unpacked) | No install and no waiting for downloads: unzip and run, the runtime is inside |
| **Installer** | `ApkStart-v*-Setup.exe` (~1.3 GB) | You want desktop and Start menu shortcuts plus an uninstall entry |
| **Light portable** | `ApkStart-v*-win64-portable.zip` (96 MiB, ~227 MB unpacked) | Just trying it out; the runtime downloads on first start |

> ⚠️ **Always use the latest build (currently 0.6.3)**. Old builds (0.5.x and earlier) either shipped no runtime and went looking for a 1.5 GB download on every start, or defaulted to an embedded window — the classic source of "slow, will not open, and a window with a rotate button appears". If you upgraded from an old build, check that your desktop icon points at the new program folder.

### 2.2 What happens on first start

1. **(Light build only) Download the runtime**: adb, Android Emulator and the Android 14 system image, measured at 10+ MB/s from the official source with 8-thread chunking and resume. The full and Store builds skip this.
2. **Expand the image once**: the xz image is expanded into `%APPDATA%\apkstart\system-images` (~20 seconds, once only).
3. **Create `/data` once**: ApkStart generates an ext4 user data image with encryption and SELinux labels (the official image only ships a 1 MB placeholder).
4. **Boot automatically**: after that, opening an app is one `am start`, about 23 seconds cold and about 10 seconds from a snapshot.

> A slow first start is normal and is a one-off cost. After that, apps open in seconds.

---

## 3. Everyday use

### 3.1 Install an app

Any of three ways:

- **Double-click an APK** (register the association first: Settings → Integration & files → associate .apk files);
- Choose "Install app" in the main window;
- Command line: `ApkStart.exe <path\to.apk>`.

`.apks` / `.xapk` split packages are supported (installed with `install-multiple`). A desktop and Start menu shortcut is created automatically.

### 3.2 Open an app

Double-click its desktop icon. All apps share one runtime, so **the second app starts almost instantly**.

### 3.3 Window and display

| Action | How |
|---|---|
| Toggle fullscreen / window | `F11` or the tray menu. Fullscreen only enlarges the window; it does not change the aspect ratio |
| Rotate the screen | `Ctrl+Alt+R` (global) or the rotate button in the title bar; the orientation is remembered per app |
| Auto fullscreen | Settings → Display & window → Auto fullscreen (works best together with "Force orientation") |
| Force landscape/portrait | Settings → Display & window → Screen orientation |

> The runtime only restarts when the panel orientation disagrees with the app's orientation (about 40 seconds, announced in the title bar). Apps with a matching orientation open in seconds afterwards.

### 3.4 Keyboard shortcuts

| Key | Action |
|---|---|
| `F11` | Toggle fullscreen / windowed mode |
| `Ctrl+Alt+R` | Rotate the current app |
| `Ctrl+R` | Rotate inside the shell window (use `Ctrl+Alt+R` in native window mode) |

### 3.5 Shared files (Windows ↔ Android)

`%USERPROFILE%\ApkStartShared` and `/sdcard/ApkStartShared` inside Android sync both ways within seconds.
Entry point: Settings → Integration & files → Shared files ("Sync now" or "Open folder").

### 3.6 Settings navigation

Since 0.6.0 the settings are grouped into eight categories with a search box on top (typing "landscape", "memory" or "proxy" matches across categories):

| Category | What it holds |
|---|---|
| Common & installation | Runtime and environment, one-click setup, start with Windows, disk usage and cleanup |
| Display & window | Display mode, auto fullscreen, screen orientation, tablet layout, window hosting |
| Controls & input | Mouse buttons, key mapping |
| Performance & resources | Resource policy, quality, data partition, system language, snapshots, pre-warming |
| Network & downloads | Updates and download sources, mirror acceleration, download threads |
| Diagnostics & repair | Machine health check, drivers/compatibility patches, automatic checks |
| Integration & files | Desktop and apps, shared files, system integration |
| Update & about | Software update, about |
| Lab | Windows-native multi-window multi-app (experimental), background retention |

> **Lab · multi-app (experimental)**: once enabled, opening an app no longer closes the previous one; several apps can stay in the background, switch back instantly and keep their login state. Because the Android runtime only has one emulator window, only one app is visible in the foreground at a time — this is not true side-by-side multi-window, and it uses more memory. Off by default; ignore it if you want stability.

### 3.7 Online updates

Settings → Update & about → Check for updates, or right-click the tray → Check for updates. The updater benchmarks sources live (GitHub / Gitee / mirrors), downloads in parallel chunks and switches source on failure. Updating never loses the runtime, installed apps or snapshots.

Newer portable builds support **incremental updates**: each release also publishes a code manifest and a small package containing only the program code (a few MB, against ~100 MB for the whole build). If your Electron shell version has not changed, the update downloads only that small package, verifies every file and replaces the code in seconds; if the shell changed, the manifest is missing or any check fails, it falls back to the full package and never leaves the program half-updated. The Store build is still updated by Microsoft Store.

> Note: only portable builds updated through "Check for updates" from GitHub / Gitee use the incremental path; Store installs use the Store channel. Incremental updates do not touch installed apps, Android data, the runtime or snapshots.

---

## 4. Three core concepts (the key to reading errors)

Most strange problems trace back to one of these three things. One minute here makes the rest of the troubleshooting easy.

### 4.1 Runtime / system image

ApkStart does not emulate a bare Android; it boots a **complete Android 14 system image**.
0.6.3 ships **one universal image** (Google Play x86_64) that runs both x86 and ARM apps — no more separate "AOSP image / compatibility image" pair as in older versions.

- A missing, corrupt or incompatible image means the boot fails, hangs in the boot phase or restarts repeatedly.
- User data (`/data`) is a thin overlay; the system image is shared by the whole machine.

### 4.2 Hardware acceleration

An emulator is only fast with CPU virtualisation. Windows offers two paths:

| Path | What it is | Needs admin | Reboot after |
|---|---|---|---|
| **WHPX** | The built-in "Windows Hypervisor Platform" feature (HypervisorPlatform) | To enable the feature | Yes |
| **AEHD** | Google's own kernel driver | To install the driver | No |

**It still runs without acceleration** (pure software emulation, TCG), but booting takes minutes and frames drop — that is "slow", not "fails to start". ApkStart falls back automatically and retries up to four parameter combinations (renderer backend → acceleration path → memory/cold boot).

> Do not mistake **VirtualMachinePlatform** (used by WSL2) for the acceleration switch. The emulator needs **HypervisorPlatform**. With only the former enabled, `emulator -accel-check` still reports unavailable.

### 4.3 ARM translation layer

Most Chinese Android apps only ship **ARM native libraries** (arm64-v8a / armeabi-v7a), while the system image is **x86_64** — a translation layer is needed to hand ARM instructions to the x86 CPU. The 0.6.3 universal image includes the newer `ndk_translation` layer, so ARM apps normally need no setup at all.

- The first time an ARM app appears, if the layer is not in place yet, ApkStart adds the compatibility image and restarts the runtime to retry (see 6.3).
- Old images (API 30) have compatibility problems with the newer layer (ByteDance apps hitting `DoBadTrampoline` SIGABRT, for example); the Android 14 image fixes them.

---

## 5. First step when something is wrong: health check and automatic detection

Before digging through this manual, let the app check the machine — it fixes most problems on its own.

### 5.1 Machine health check · auto-configuration

Where: Settings → Diagnostics & repair → **Run health check**

- What it checks: whether CPU virtualisation (VT-x/SVM) is on, whether Hyper-V / the hypervisor platform is available, GPU / VRAM / driver, memory, OS version, `emulator -accel-check`, and the AEHD driver.
- "**Apply recommended settings**" writes the safe values automatically: memory / cores / render resolution / quality / force software emulation when there is no acceleration, and stores them as a machine driver that is applied from then on.
- Results are graded `ok` / `warn` (usable but worth tuning) / `bad` (will not run until fixed). Each has a colour and an explanation.

Only two things need you in person:
- **BIOS virtualisation**: reboot into BIOS → enable Intel VT-x / AMD SVM (the software cannot do this).
- **Windows features / acceleration driver**: see 6.1.

### 5.2 Automatic detection (auto-debug)

Where: Settings → Diagnostics & repair → "Automatic checks · smart diagnostics"

Every 10 minutes the machine is inspected in the background and problems are grouped into six categories, each with a **one-click fix** (restart the runtime, clear locks, kill orphan processes, discard snapshots, clean disk, reset Android networking…), followed by an automatic re-check:

| Category | What it covers |
|---|---|
| Runtime | The real reason the last start failed, boot hangs, leftover lock files, orphan emulator processes, empty snapshots, no hardware acceleration |
| Device connection | adb not authorised, offline, runtime running but adb cannot see the device |
| Storage | Free disk, data partition differing from its configuration, shared folder not writable |
| Settings | Screen orientation conflicting with the physical panel, auto fullscreen ineffective in native window mode |
| Network / log | No network inside Android, unreachable download sources, errors in the recent log |

> Two rules: a failed probe is never reported as a problem (no status means "unknown", never a guess), and the same old problem does not nag repeatedly.

### 5.3 Export a diagnostics report

Where: Settings → Diagnostics & repair → **Export diagnostics** (the same button exists on the system integration page)

The report is plain text and contains the machine configuration, the launch parameters chosen automatically, the log and the conclusions. Attaching it to a bug report speeds diagnosis up considerably.

### 5.4 Built-in manual and automatic guides

Since 0.6.3 this manual is **embedded in the app**: the "?" button in the title bar and "Open user manual" under Settings → About both open it, with search, scrolling and print/save-as-PDF. It jumps straight to the section relevant to the current fault.

Automatic detection and repair also bring the guide to you:

- When a check finds a problem, its entry has a "Guide" button that opens the matching section;
- For hardware acceleration, installation failures, the ARM translation layer, adb authorisation and missing audio, **the matching guide opens automatically after an automatic fix fails**, so you do not have to come back here;
- Each guide opens automatically only once per run and never interrupts you repeatedly.

> To open it by hand: the `?` button in the title bar. To stop the automatic pop-ups, turn notifications off in the automatic check settings; the guides still open from the "Guide" button on each problem entry.

---

## 6. Troubleshooting

### 6.1 "Hardware acceleration is off" / slow boot

**Symptoms**: settings or diagnostics report "no hardware acceleration right now" or "hardware acceleration unavailable"; booting takes minutes and frames drop.

**First, be clear**: this is usually "slow", not "will not open". ApkStart has already fallen back to software emulation. Acceleration is only needed for smoothness.

**By build:**

- **Installer / portable**: Settings → Diagnostics & repair → Machine health check → find "Hardware acceleration is off" → click **Repair**. One UAC prompt appears and WHPX is enabled automatically; if that fails (unsupported system, or you decline), the AEHD driver is installed instead.
- **Microsoft Store (MSIX) build**: Store apps **cannot elevate themselves**, so "Repair" opens the "Turn Windows features on or off" dialog:
  1. Tick **"Windows Hypervisor Platform" (HypervisorPlatform)**;
  2. Click OK and **reboot** once.

  You can also run this in an **administrator PowerShell**:

  ```powershell
  dism /online /enable-feature /featurename:HypervisorPlatform /all /norestart
  dism /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
  ```

> Two traps: (1) do not enable only VirtualMachinePlatform — that is not the acceleration the emulator needs; (2) if VT-x/SVM is off in BIOS, enable it first as described in 5.1, otherwise enabling the Windows feature changes nothing.
> If your GPU driver is more than three years old, update it from the vendor site; ApkStart will not install drivers automatically (installing the wrong one is worse). Some older GPUs and integrated graphics need a compatibility patch: Settings → Diagnostics & repair → Drivers · compatibility patches.

---

### 6.2 Installation failed (INSTALL_FAILED_*)

**Symptoms**: installing an app fails with a message starting "Installation failed:" and ending in an `INSTALL_*` code.

ApkStart translates the raw English error. Match it against this table:

| Code | Meaning | What to do |
|---|---|---|
| `INSTALL_FAILED_NO_MATCHING_ABIS` | The app only ships ARM libraries and the current image has no ARM translation layer | **Usually automatic**: ApkStart switches to the compatibility image and retries. See [6.3](#63-no-arm-translation-layer--arm-apps-will-not-install-or-crash) |
| `INSTALL_FAILED_OLDER_SDK` | The app needs a newer Android | A newer system image is required; the current one is Android 14 (API 34), so this is rare |
| `INSTALL_PARSE_FAILED_NO_CERTIFICATES` | The APK has no valid signature | The APK is corrupt or unofficial; obtain it again |
| `INSTALL_PARSE_FAILED_INCONSISTENT_CERTIFICATES` / `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | Signature differs from the installed version | Uninstall the old version first |
| `INSTALL_FAILED_VERSION_DOWNGRADE` | A higher version is already installed | Downgrades are not allowed; install the newer one or uninstall first |
| `INSTALL_FAILED_INSUFFICIENT_STORAGE` | The runtime is out of disk space | Free some disk, or move the runtime data folder to a drive with space (Settings → System integration) |
| `INSTALL_FAILED_INVALID_APK` | The APK is corrupt or incomplete | The download probably did not finish; download it again |
| `INSTALL_FAILED_INVALID_URI` | The APK path contains special or non-ASCII characters | Move the APK to an all-ASCII path and retry |
| `INSTALL_FAILED_ALREADY_EXISTS` | An app with the same name and a different signature exists | Uninstall it first |
| `INSTALL_FAILED_DEPRECATED_SDK_VERSION` | The app targets a very old Android | **Automatic**: ApkStart retries with the official bypass flag |
| `INSTALL_FAILED_TEST_ONLY` | Test-only package | **Automatic**: retried with the test-package flag |
| `INSTALL_FAILED_MISSING_SHARED_LIBRARY` | A required device feature or vendor library is missing | The app needs a specific vendor environment the emulator cannot provide |
| `INSTALL_FAILED_USER_RESTRICTION` | The system restricts installation | Restart the runtime and retry |
| `INSTALL_FAILED_CONFLICTING_PROVIDER` | ContentProvider conflict with an existing app | Uninstall the conflicting app |
| `INSTALL_FAILED_INTERNAL_ERROR` | Internal system error (often low storage or an unfinished boot) | Restart the runtime, wait for the boot to finish and retry |

> If you see a raw English code that is not in this table, export diagnostics (5.3) and report it.

---

### 6.3 No ARM translation layer / ARM apps will not install or crash

**Symptoms**: installing reports `INSTALL_FAILED_NO_MATCHING_ABIS` with text saying the app only ships ARM native libraries and the image has no ARM translation layer; or the app installs but crashes on launch with `DoBadTrampoline`, `libndk_translation`, `UnsatisfiedLinkError` or `...so not found` in the log.

**Why**: 0.6.3 uses **one universal Android 14 image** that serves both x86 and ARM, with the layer built in. Older versions required switching images by hand; the "Universal compatibility image (managed automatically)" switch now exists **only for compatibility with old configurations** and normally needs no attention.

**What ApkStart does automatically:**

1. On `NO_MATCHING_ABIS` it switches to the compatibility image, restarts the runtime, reinstalls the installed apps from their local APK backups and retries the installation (look for "Switching to the compatibility image and restarting the runtime…" in the log).
2. If an app crashes with a log that clearly points at the ARM layer (`DoBadTrampoline`), it switches to the Android 14 compatibility image and retries ("ARM translation layer crash detected; switching to the compatibility image…").

**What you need to do:**

- **Be patient**: switching images restarts the runtime, which takes about 40 seconds to a minute, and a message window may appear.
- **Confirm the image is in place**: Settings → Common & installation → Runtime, check "Universal compatibility image (managed automatically)"; if it says not downloaded, click "Download compatibility image" (~1.5 GB) and **restart the runtime** afterwards.
- **Still crashing**: a few apps carry deeper anti-emulation checks (verifying real sensors, the baseband and so on) and cannot run in an emulator. They report this in plain language; it is a limitation, not a fault.

**What if you see a red "Installation failed" that also claims "switching to the compatibility image and retrying"?**

That was a display bug in an older build: the image was on disk, but reused from an old runtime without the translation layer, so the switch-and-retry was skipped and the failure was reported while the message still said "retrying". **You are not on the latest code — upgrade to the current 0.6.3 build** (the version this manual describes probes the runtime's real translation capability before installing instead of only checking that the image file exists; `NO_MATCHING_ABIS` always triggers switch + restart + snapshot reset + reinstall; a second failure is reported honestly). Install once more after upgrading.

> Measured: Hongguo Free Drama (com.phoenix.read, arm64-v8a-only) installs normally on the Android 14 image with the newer layer, reaches the recommendation feed and plays video. `ro.product.cpu.abilist` on the current runtime is `x86_64,arm64-v8a`, so the layer is active.

---

### 6.4 adb not authorised (Allow USB debugging)

**Symptoms**: diagnostics report "adb not authorised" or "Android debug authorisation is incomplete", `adb devices` shows `unauthorized`, and apps never start.

**The right way (in order):**

1. Look for an emulator window showing the **"Allow USB debugging?"** dialog — click **Allow** in that window and tick **"Always allow from this computer"** so it never asks again.
2. If the window does not respond or never appears: Settings → Runtime → **Reset Android data / Clear Android data** and retry (installed apps are cleared, the APK files remain and reinstall automatically; the system itself is untouched).

> ⚠️ **Never delete `%USERPROFILE%\.android\adbkey`**. Measured: that makes it worse. Android only writes a new public key when `adb_keys` does not exist; with a new private key, the old public key stored in the system still applies, the two never match and authorisation can never succeed.

> Command line check: ApkStart's adb server runs on a **dedicated port 5044**, fully separate from your own 5037:
> ```powershell
> $env:ANDROID_ADB_SERVER_PORT = 5044
> adb devices    # should list emulator-5554
> ```
> Do not `adb connect` to port 5555 by hand — the Play image then shows "Allow USB debugging" on top of the app, which looks like the program is broken.

---

### 6.5 Icon does nothing / endless spinner / window with a rotate button

These almost always point at the **launch entry point or window hosting**. Check in this order.

**① Make sure you are running the new build**

- Look at the start of `%APPDATA%\ApkStart\logs\app.log`: it should say `start v0.6.3`. If it says `v0.5.x`, your desktop and Start menu icons point at the old program folder.
- Old builds (0.5.x) shipped no runtime and defaulted to the embedded window → "very slow, plus a shell window with a rotate button". Move to 0.6.3 and point the shortcuts at the new `ApkStart.exe`.

**② Expect a boot to take time**

A cold boot takes about 23–48 seconds and an orientation restart about 50 seconds; that is normal. Clicking the icon during that time looks like "nothing happens" while the runtime boots in the background. **Do not click repeatedly**: a second instance takes over the emulator, and the first instance's shutdown can kill it, which makes the launch fail (0.6.3 adds `owner.pid` protection, but queueing still looks like nothing happening). Click once and wait.

**③ Native window not taken over → falls back to the embedded window with a rotate button**

If the log shows `attach failed` or `emu:0`, the window agent could not find the emulator window and the app fell back to embedded mode — the shell window with a title bar and rotate button.
- This is more likely when started through a directory junction or a non-standard path; 0.6.3 resolves the real path before matching. If it still happens, report it with the log.

**④ Reset the Android data (last resort)**

Settings → Common & installation → **Reset Android data** (with a second confirmation). Installed apps and their data are cleared, but the system itself stays, the app list is kept and apps reinstall when clicked. Use it for a corrupt data partition or a `/data` that will not mount.

---

### 6.6 Other launch issues at a glance

ApkStart **already handles most of these** automatically; the table says what it does and what is left for you. If the automatic fix does not help, export diagnostics as described in 5.3.

| Diagnostic | Automatic handling | What you can still do |
|---|---|---|
| Hardware acceleration unavailable | Falls back to software emulation | Enable acceleration as in 6.1 |
| Memory allocation failed | Lowers memory and core count | Close memory-hungry programs |
| Emulator port in use | Switches to a free port | Quit other emulators (Nox/MuMu/BlueStacks) or reboot |
| Leftover lock files / "Running multiple emulators with the same AVD" | Clears the AVD lock and retries | Confirm no other emulator uses the same runtime |
| System image missing, corrupt or incompatible with old data | Reboots with clean user data | Settings → Runtime: delete the image and download it again |
| Corrupt quick-boot snapshot | Discards the snapshot and cold-boots | The next clean exit rebuilds it; or turn snapshots off |
| Runtime components deleted / VC++ runtime missing | — | Whitelist ApkStart in antivirus and unzip again; install the Microsoft VC++ 2015-2022 runtime |
| Out of disk space | — | Move the runtime folder to a drive with space; turn snapshots off or shrink the data partition |
| Path contains non-ASCII or special characters | Switches to a short path | Move ApkStart to an all-ASCII folder (e.g. `C:\ApkStart`) |
| CPU lacks an instruction set (AVX/SSE4) | — | Often only a warning and it still boots; otherwise use a machine with VT-x/AVX or an older engine |
| Current runtime rejects this GPU mode | Picks a GPU mode that fits the engine version | — |
| GPU / unknown error | Retries with several parameter sets | Update the GPU driver, write a compatibility patch, or export diagnostics |

**Desktop icons show the ApkStart logo or a blank icon**: Settings → System integration → **Rebuild shortcuts** (rewrites the desktop and Start menu shortcuts from the current app list, fixing icons and taskbar identity too). Do this after moving shortcuts as well, since a stale path breaks them.

---

### 6.7 No app audio / audio too quiet

**Symptoms**: video and notification sounds inside Android apps are silent; or other Windows software has sound but apps inside ApkStart do not.

**Separate the cases first**: if the whole system has no sound, fix Windows audio first; only continue below when the silence is limited to apps inside ApkStart.

1. **Windows volume and output device**: click the volume icon in the taskbar and confirm nothing is muted, the volume is not zero and the output device is the headset or speakers you are using. Open the volume mixer and check that the ApkStart / Android runtime row is not muted or pulled to zero on its own.
2. **Volume inside the app**: some apps set the media volume to zero the first time they open; raise it in the app's own settings or with the Android volume keys. Bilibili, Douyin and others can also turn off autoplay sound inside the app.
3. **The ApkStart sound switch**: Settings → Common & installation → **Android app audio** must be ticked. The 0.6.3 automatic checks watch this and report it under Settings → Diagnostics & repair, where "Fix" turns it on in one click. **The Android runtime must be restarted afterwards** (the switch decides whether the emulator starts with `-no-audio`; changing it while running does not take effect immediately).
4. **Windows audio service**: press `Win+R`, type `services.msc`, find **Windows Audio** and confirm it is "Running" with start type "Automatic". Start it if disabled; the 0.6.3 automatic checks also catch and report this. An administrator PowerShell can run `net start Audiosrv`.
5. **Bluetooth headsets / multiple outputs**: after switching to a Bluetooth headset Windows sometimes does not move already-running programs over. Disconnect and reconnect the headset, or restart the Android runtime once.
6. **Still silent**: export diagnostics from Settings → Diagnostics & repair and report it; the report carries the sound switch and the audio service state, which shows whether the cause is configuration, a system service or the app itself.

> When an automatic fix fails, the app opens this section for you. If you turned off automatic check notifications, reach it from the "Guide" button on the problem entry or the `?` in the title bar.

---

### 6.8 Store build fails to start / 0xC0000135 (DLL load failure)

**Symptoms**: the app spins forever or exits immediately and the diagnostics report shows exit code `0xC0000135` (decimal `3221225781`). Most common in builds **installed from Microsoft Store**.

**Correct a common misreading first**: `0xC0000135` only means "a DLL failed to load". It does **not** necessarily mean the VC++ runtime is missing, and it does **not** necessarily mean antivirus removed a file. Three causes hide behind the same code, so do not reinstall over and over on the assumption of the first:

1. **Path limits of the Store (MSIX) build**: it lives in the read-only `C:\Program Files\WindowsApps\...` folder. When the Android runtime starts child processes such as `qemu` from there, the child resolves DLLs by relative path and container path redirection or environment isolation can break that, so it exits with `0xC0000135`. This is specific to the Store build and cannot be fixed by reinstalling VC++.
2. **The VC++ runtime really is missing**: the Android runtime (Qt6 / qemu) depends on Microsoft VC++ 2015-2022 (x64). If Settings → Diagnostics & repair explicitly reports "Missing the VC++ runtime (x64)", the DLL file really is absent and "Fix" installs it in one click.
3. **Antivirus quarantined runtime files**: DLLs in the runtime folder being quarantined or deleted produces the same code. Whitelist the ApkStart install folder and the runtime data folder, then install again.

**Check in order:**

1. **Does diagnostics really report missing VC++?** If the entry "Missing the VC++ runtime (x64)" appears, click its one-click fix, reboot and try again. **Do not** reinstall just because the code is `0xC0000135` — confirm that entry first.
2. **No VC++ report but still failing → most likely the Store path problem**: this is the most likely cause right now. Try in order:
   - Quit ApkStart completely (tray icon → Quit) and start it again;
   - Check your antivirus "controlled folder access / ransomware protection" and whitelist ApkStart, then reboot;
   - If that does not help, use the **portable build** (`ApkStart-win64-portable` from the GitHub / Gitee releases) in an all-ASCII folder such as `C:\ApkStart` — the portable build does not live under WindowsApps and sidesteps the limit entirely.
3. **Want the exact failing DLL (advanced)**: the most useful thing you can tell the developer is which DLL is missing. Open Event Viewer → Windows Logs → Application, find the `Application Error` entry for ApkStart / emulator and read `FaultingModuleName`; or export diagnostics from Settings → Diagnostics & repair and attach the report.
4. **adb crashes as well?** If the event log also shows `adb.exe` with `0xC0000409`, that is a separate issue (device connection), not the direct cause of the emulator exit. Handle startup with steps 1–3 above and mention the adb problem separately in your report.

> This section opens automatically: when a start or repair failure is judged to be a DLL problem, the app jumps straight here. It is also reachable from the "Guide" button on the automatic check entry or the `?` in the title bar.

---

## 7. Command line reference

```
ApkStart.exe                          open the main window
ApkStart.exe <path\to.apk>            install an APK
ApkStart.exe --launch <package>       start an app directly (what desktop shortcuts use)
```

---

## 8. Data and folders

| Purpose | Location |
|---|---|
| Runtime (adb / emulator / images) | Bundled, or `%APPDATA%\apkstart\runtime` (light build) |
| Expanded system image | `%APPDATA%\apkstart\system-images` |
| AVD / installed apps / snapshots | `%APPDATA%\apkstart\avd` |
| App icons | `%APPDATA%\apkstart\icons\<package>.ico` |
| Settings and app list | `%APPDATA%\ApkStart\settings.json` / `apps.json` |
| Logs / diagnostics reports | `%APPDATA%\ApkStart\logs\` |
| Windows ↔ Android shared folder | `%USERPROFILE%\ApkStartShared` ↔ `/sdcard/ApkStartShared` |

> "Reset Android data" clears only the user data layer; the system image and APK files stay. Updating the app never loses the runtime, installed apps or snapshots.
>
> Keep plenty of space on the C: drive: the expanded image, the data partition and snapshots together can reach several GB. Running out causes install and boot failures.

---

## 9. Help and feedback

Three things speed diagnosis up enormously:

1. **The diagnostics report**: Settings → Diagnostics & repair → Export diagnostics;
2. **The last 20 lines of app.log**: `%APPDATA%\ApkStart\logs\app.log`;
3. **Your version and build**: for example "Store build 0.6.3" or "Full portable 0.6.3".

- GitHub: <https://github.com/RoutineMiku/apkstart> (Issues / Releases)
- Gitee: <https://gitee.com/daily-miku/apkstart>

---

*This manual describes v0.6.3 and is updated with each release. If the wording in the app differs slightly, the app wins.*
