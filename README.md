# CampusLife Buddy

CampusLife Buddy is a native mobile reminder assistant for students using the official VTU Campus Life system. It helps students remember manual check-in, activity/photo, and checkout tasks; it never accesses the official system or stores its credentials.

## Current status

Phases 1–3 are implemented: Expo Router navigation, a focused black-and-white design system, onboarding, authentication screens, a secure Express/Prisma authentication API, and timezone-aware schedule/session/reminder APIs. Local mobile notification scheduling is next.

## Structure

```text
apps/mobile     Expo + React Native application
apps/server     Express API (Phase 2)
packages/shared Shared types and business rules (Phase 2)
prisma          Database schema and migrations (Phase 2)
docs            Architecture and deployment documentation
```

## Run the mobile app

```bash
npm install
cd apps/mobile
npx expo start
```

Create `apps/mobile/.env` from the root `.env.example` when the API is available.

## Run the API

Set `DATABASE_URL`, `JWT_SECRET`, and `CORS_ORIGIN` in `apps/server/.env`, then run:

```bash
npx prisma generate --schema prisma/schema.prisma
npx prisma migrate dev --schema prisma/schema.prisma
npm run dev:server
```

## EAS builds

```bash
eas login
eas build:configure
eas build --platform android
eas build --platform ios
```

iOS distribution requires an appropriately configured Apple Developer account.
