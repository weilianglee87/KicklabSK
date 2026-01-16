const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1264,
        height: 682,
        fullscreen: false,
        autoHideMenuBar: true,
        frame: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        }
    });

    // Load the Vite dev server or built app
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
        mainWindow.loadURL('http://localhost:5179');
        // Open DevTools in development
        // mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
    }

    // Toggle fullscreen with F11
    mainWindow.on('enter-full-screen', () => {
        mainWindow.setMenuBarVisibility(false);
    });

    mainWindow.on('leave-full-screen', () => {
        mainWindow.setMenuBarVisibility(true);
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
