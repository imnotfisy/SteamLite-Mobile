# SteamLite Mobile

The Android app for [SteamLite](https://github.com/imnotfisy/SteamLite). Sign in with Steam to chat with friends (photos, voice messages, groups, streaks), see your games and wishlist, find what to play together, run friend challenges and browse or publish themes.

## Install
1. Download `SteamLite-Mobile-<version>.apk` from the [latest release](../../releases/latest) on your phone.
2. Open it. Android asks once to allow installs from your browser or files app.
3. Open SteamLite and sign in with Steam.

Updates: the app checks `version.json` in this repo and shows an **Update** banner when a newer version is out. Tap it, download the file and open it to install over the old one.

## How it works
A small native shell (Java) around a web UI in `app/src/main/assets/www`. All network calls go through the shell to the SteamLite Online server (a Cloudflare Worker, see the SteamLite repo's `source/cloudflare`). Notifications are instant: SteamLite Online sends a push through Firebase Cloud Messaging, and you can reply right from the notification. If push is not available, messages are checked every ~15 minutes instead.

## Build
Needs Android Studio (for its JDK) and the Android SDK (platform 36). Push notifications need your own Firebase project: add its `google-services.json` to `app/` (it is not in this repo). Without it the build fails at the Google services step.
```
cd android
gradlew assembleDebug        # debug build
```
Release builds are signed with a key in `signing/` that is **not** in this repo. Updates only install over an older version if they are signed with the same key. `release.ps1 -Notes "..."` builds, creates the GitHub release and updates `version.json` last.

## Layout
- `app/src/main/java/com/steamlite/mobile/` MainActivity (bridge to the page), PollService (notifications), Net, BootReceiver
- `app/src/main/assets/www/` index.html, app.css, core.js (network, cache, look, updates), chat.js, social.js
- `version.json` the update check

