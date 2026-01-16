# Speed Kick - Fullscreen Desktop App

## Quick Start Options

### Option 1: Browser Kiosk Mode (Immediate)

**Chrome:**
```powershell
chrome.exe --app=http://localhost:5179 --start-fullscreen
```

**Edge:**
```powershell
msedge.exe --app=http://localhost:5179 --start-fullscreen
```

This opens the app without browser UI (no address bar, tabs, etc.)

### Option 2: Electron Desktop App (Recommended)

**Development Mode:**
```bash
npm run electron:dev
```
This starts both Vite dev server and Electron app.

**Standalone App:**
```bash
npm run electron
```
(Make sure Vite dev server is running separately: `npm run dev`)

**Build Installer:**
```bash
npm run electron:build
```
Creates a Windows installer in the `release/` folder.

## Fullscreen Controls

- **F11**: Toggle fullscreen
- **Fullscreen button**: Click the button in top-right corner
- **ESC**: Exit fullscreen

## Features

- Fixed 1264x682px window size
- No browser UI visible
- Native desktop app experience
- Fullscreen mode support
- Can be packaged as standalone .exe

## Production Deployment

1. Build the web app: `npm run build`
2. Build Electron installer: `npm run electron:build`
3. Distribute the installer from `release/` folder
