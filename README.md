# CampusLife Buddy

CampusLife Buddy is a native mobile reminder assistant for students using the official VTU Campus Life system. It helps students remember manual check-in, activity/photo, and checkout tasks; it never accesses the official system or stores its credentials.

## Current status

Phases 1–3 are fully implemented: Expo Router navigation, black-and-white design system, onboarding, authentication screens, a secure Express/Prisma authentication API, timezone-aware schedule/session/reminder APIs, local mobile notification scheduling for reminders (`expo-notifications`), and camera activity photo scanning (`expo-image-picker`).

## Hosting & Deployment

For complete, step-by-step instructions on hosting the backend server on Render/Railway, deploying the web app on Vercel, and building mobile APK/iOS binaries using EAS, see the [HOSTING.md](file:///Users/amruth/Desktop/campusbudy/HOSTING.md) guide.

## Structure

```text
apps/mobile     Expo + React Native application
apps/server     Express API
packages/shared Shared types and business rules
prisma          Database schema and migrations
HOSTING.md      Complete hosting & deployment instructions
```

## Run the mobile app

```bash
npm install
npm --workspace @campuslife/mobile run start
# Or for Web:
npm --workspace @campuslife/mobile run web
```

## Run the API

Set `DATABASE_URL`, `JWT_SECRET`, and `CORS_ORIGIN` in `apps/server/.env`, then run:

```bash
npm --workspace @campuslife/server run prisma:generate
npm --workspace @campuslife/server run dev
```

## EAS builds & Hosting

See [HOSTING.md](file:///Users/amruth/Desktop/campusbudy/HOSTING.md) for full instructions:

```bash
eas login
eas build:configure
eas build --platform android --profile preview
```

