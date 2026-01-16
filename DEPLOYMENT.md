# Speed Kick Cloud Platform - Deployment Guide

## 1. Data Architecture
Your application uses a hybrid storage model:
- **Cloud Database (Firebase Firestore)**: Stores all "Source of Truth" data (Events, Scores, Users, Status).
- **Local Database (IndexedDB)**: Used by the "Station" app to buffer scores when offline.
- **Authentication (Firebase Auth)**: Handles Admin and Station logins.

You do **not** need to set up a separate SQL database or server. Firestore scales automatically.

## 2. Web Hosting (Admin & Public Display)
Since the app is built with Vite (React), it compiles to static files (`index.html`, `js/`, `css/`). The best place to host this, given you are already using Firebase, is **Firebase Hosting**.

### Step 1: Install Firebase Tools
If you haven't already:
```bash
npm install -g firebase-tools
```

### Step 2: Login
```bash
firebase login
```

### Step 3: Initialize Hosting
Run this in your project root (`d:\KicklabSK\speed-kick-web`):
```bash
firebase init hosting
```
- **Select your project**: Choose the project ID you put in `src/lib/firebase.ts`.
- **Public directory**: Type `dist`
- **Configure as single-page app?**: Type `y` (Yes)
- **Set up automatic builds with GitHub?**: `n` (No, for now)

### Step 4: Build & Deploy
```bash
npm run build
firebase deploy --only hosting
```

Your Admin Dashboard and Public Display will now be live at:
`https://<your-project-id>.web.app`

## 3. Station Deployment (Hardware)
The "Station" app needs to connect to the USB Serial Port. You have two options:

### Option A: Web Browser (Chrome/Edge)
- Open Chrome on the mini-PC/Laptop.
- Go to `https://<your-project-id>.web.app/station`.
- Chrome supports **WebSerial**. When you click "Connect HW", a browser popup will ask to select the COM port.
- **Pros**: Easy updates (just refresh page).
- **Cons**: User must manually select port permission once.

### Option B: Electron App (Native Wrapper)
- You already have `electron` and `electron-builder` in your `package.json`.
- This wraps the web app in a native window.
- **Pros**: Can bypass permission checks (kiosk mode), Fullscreen control, Offline start.
- **Cons**: Harder to update (must reinstall .exe).

**Recommendation**: Start with **Option A** (Web) for simpler ops. If you need stricter Kiosk features, build the Electron version.
