# StudyLab

Android app for organizing study material — subjects, files, links, and notes — backed by Firebase (Firestore + Storage + Auth).

Package: `com.example.studylab`

## Tech stack

- Android (minSdk 24, targetSdk 34, compileSdk 36)
- Java 11
- Android Gradle Plugin 9.2.0
- Firebase BoM 32.7.2 (Firestore, Storage, Auth)
- Redis 7.4 (High-performance caching layer)
- Next.js 14 (App Router) + TailwindCSS
- Credentials API + Google Sign-In (One Tap)
- Glide, Material Components, RecyclerView, ViewPager2

## Prerequisites

- Android Studio (matching AGP 9.2.0)
- JDK 17
- Android SDK with platform 36 installed
- A Firebase project (the repo ships with `app/google-services.json` for the existing `studylab-86b07` project)

## Setup

1. Clone the repo and open in Android Studio — Gradle sync will fetch all dependencies.
2. `local.properties` is gitignored. Android Studio generates it automatically on first sync; if it doesn't, create one with:
   ```
   sdk.dir=<path-to-your-Android-Sdk>
   ```
3. **Set the backend IP for physical devices.** The Android app reads `server.ip` from `local.properties` to build its API base URL (`app/build.gradle.kts` → `BuildConfig.SERVER_IP` → `ApiClient.BASE_URL`). If you skip this, it falls back to `10.0.2.2`, which only works on the Android emulator — a physical device on Wi-Fi cannot reach the backend.

   Find your dev machine's LAN IP (the one your phone can see), and add it to `local.properties` **before** running Gradle sync / a build:
   ```
   sdk.dir=<path-to-your-Android-Sdk>
   server.ip=<your-LAN-IP, e.g. 10.7.10.31>
   ```
   Then **Build → Clean Project** and rebuild so `BuildConfig.SERVER_IP` is regenerated. The phone and the dev machine must be on the same network, and the backend must be bound to `0.0.0.0:3000` (not `127.0.0.1`) so it's reachable off-host.
4. `app/google-services.json` is committed — no extra step needed to wire Firebase.
5. **Add your debug keystore SHA-1 to the Firebase console** (Project Settings → Your apps → Android app → Add fingerprint). Without this, Google Sign-In / Auth will fail on your machine. Get your SHA-1 with:
   ```
   ./gradlew signingReport
   ```
6. Run the `app` configuration on a device or emulator (API 24+).

## Project structure

- `app/src/main/res/` — layouts, drawables, colors, strings, menus, animators
- `backend/` — FastAPI Server with Redis caching
- `mentor-crm/` — Premium Dashboard for student management
- `db/` — MySQL Schema and Optimization scripts

## Firebase collections / storage

- Firestore: subjects, files, links, notes (see repositories in `vault/`)
- Storage: uploaded files per subject

## Notes for contributors

- Keep `local.properties` out of commits.
- Don't commit anything in `.claude/` (already gitignored).
- If you rotate Firebase or add a new Google Sign-In flow, re-verify SHA-1 fingerprints for every team member's debug keystore.
