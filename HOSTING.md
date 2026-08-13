# 🚀 Hosting & Deployment Guide for CampusLife Buddy

This guide provides step-by-step instructions to host and deploy both the **Backend API Server** (`apps/server`) and the **Frontend Mobile & Web App** (`apps/mobile`).

---

## 📋 Overview

| Component | Technology | Recommended Hosting Platform | Output / Production URL |
| :--- | :--- | :--- | :--- |
| **Backend API** | Node.js + Express + Prisma | [Render](https://render.com) / [Railway](https://railway.app) | `https://your-api.onrender.com` |
| **Database** | PostgreSQL | [Supabase](https://supabase.com) (Currently Active) | Managed DB Connection URL |
| **Web App** | React Native Web + Expo | [Vercel](https://vercel.com) / [Render Static Site](https://render.com) | `https://your-app.vercel.app` |
| **Mobile App** | Expo (iOS / Android) | [Expo Application Services (EAS)](https://expo.dev/eas) | Native `.apk` / `.aab` / App Store |

---

## 1. Hosting the Backend API Server (`apps/server`)

### Option A: Deploying on Render (Free / Cheap & Simple)

1. **Sign Up / Log in**: Create an account on [Render.com](https://render.com).
2. **New Web Service**: Click **New +** -> **Web Service** and connect your GitHub repository.
3. **Configure Service Settings**:
   - **Name**: `campuslife-api`
   - **Region**: Select nearest region (e.g. Singapore / Frankfurt / Oregon).
   - **Branch**: `main` (or `new`)
   - **Root Directory**: Leave blank (monorepo root)
   - **Environment**: `Node`
   - **Build Command**:
     ```bash
     npm install && npm --workspace @campuslife/server run prisma:generate && npm --workspace @campuslife/server run build
     ```
   - **Start Command**:
     ```bash
     npm --workspace @campuslife/server run start
     ```

4. **Set Environment Variables** (under *Environment Settings*):
   | Variable | Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Production mode flag |
   | `PORT` | `3000` | Port for Express server |
   | `DATABASE_URL` | `postgresql://...` | Your Supabase PostgreSQL URL |
   | `JWT_SECRET` | `your-32-char-random-secret-key` | JWT token secret |
   | `CORS_ORIGIN` | `https://your-web-app.vercel.app` | URL of your deployed frontend |

5. **Deploy**: Click **Create Web Service**. Render will build and deploy your API server.

---

## 2. Hosting the Web Frontend (`apps/mobile`)

### Option A: Deploying on Vercel

1. **Sign Up / Log in**: Go to [Vercel.com](https://vercel.com) and import your project repository.
2. **Project Settings**:
   - **Framework Preset**: `Other` or `Expo`
   - **Root Directory**: `apps/mobile`
   - **Build Command**:
     ```bash
     npx expo export --platform web
     ```
   - **Output Directory**: `dist`
3. **Environment Variables**:
   | Variable | Value |
   | :--- | :--- |
   | `EXPO_PUBLIC_API_URL` | `https://campuslife-api.onrender.com/api` |
4. **Deploy**: Click **Deploy**. Vercel will build and output your production web app.

---

## 3. Building & Deploying the Native Mobile App (Android & iOS)

### Step 1: Install EAS CLI & Log In
```bash
npm install -g eas-cli
eas login
```

### Step 2: Configure EAS Build
Inside `apps/mobile`:
```bash
cd apps/mobile
eas build:configure
```

### Step 3: Build Android APK (For Testing & Distribution)
To build a standalone APK file for Android phones:
```bash
eas build --platform android --profile preview
```
Once complete, EAS will give you a direct download link for the `.apk` file to install on any Android phone.

### Step 4: Build for Production Stores (Google Play / App Store)
- **Android App Bundle (.aab)**:
  ```bash
  eas build --platform android --profile production
  ```
- **iOS App Store Build**:
  ```bash
  eas build --platform ios --profile production
  ```

---

## 🔔 Reminder Notifications Status

- **Status**: **Fully Available & Enabled** for iOS and Android devices.
- **Implementation**: Handled via `expo-notifications` in `apps/mobile/notifications/notification.service.ts`.
- **Features**:
  - Automatically requests user permission on onboarding/settings.
  - Schedules local alerts up to 14 days in advance according to student's custom schedule.
  - Alerts student for:
    1. **Check-In Reminder** (*Start of Campus Life*)
    2. **Activity / Photo Confirmation** (*Periodic reminders*)
    3. **Checkout Warning** (*X minutes before end time*)
    4. **Checkout Confirmation** (*End of Campus Life*)

---

## 🛠️ Quick Command Checklist

```bash
# Test production server build locally
npm --workspace @campuslife/server run build
npm --workspace @campuslife/server run start

# Export production web app bundle locally
cd apps/mobile
npx expo export --platform web
```
