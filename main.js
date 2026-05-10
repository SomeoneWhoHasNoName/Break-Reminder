const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');

let tray = null;
let mainWindow = null;
let workTimer = null;

// Settings in minutes
let workInterval = 30; 
let breakDuration = 5;

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

app.setLoginItemSettings({
  openAtLogin: true,
  path: app.getPath('exe')
});

function createWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
  
  // Prevent closing the window manually, just hide it
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  // Use nativeImage to ensure it scales correctly
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  
  updateTrayMenu();
  tray.setToolTip('Break Reminder');
}

function updateTrayMenu() {
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Take a break now', click: () => triggerBreak() },
    { type: 'separator' },
    { label: 'Work Interval', submenu: [
      { label: '15 mins', type: 'radio', checked: workInterval === 15, click: () => setWorkInterval(15) },
      { label: '30 mins', type: 'radio', checked: workInterval === 30, click: () => setWorkInterval(30) },
      { label: '45 mins', type: 'radio', checked: workInterval === 45, click: () => setWorkInterval(45) },
      { label: '60 mins', type: 'radio', checked: workInterval === 60, click: () => setWorkInterval(60) }
    ]},
    { label: 'Break Duration', submenu: [
      { label: '2 mins', type: 'radio', checked: breakDuration === 2, click: () => setBreakDuration(2) },
      { label: '5 mins', type: 'radio', checked: breakDuration === 5, click: () => setBreakDuration(5) },
      { label: '10 mins', type: 'radio', checked: breakDuration === 10, click: () => setBreakDuration(10) },
      { label: '15 mins', type: 'radio', checked: breakDuration === 15, click: () => setBreakDuration(15) }
    ]},
    { type: 'separator' },
    { label: 'Quit', click: () => {
      app.isQuitting = true;
      app.quit();
    }}
  ]);
  tray.setContextMenu(contextMenu);
}

function setWorkInterval(mins) {
  workInterval = mins;
  updateTrayMenu();
  startWorkTimer();
}

function setBreakDuration(mins) {
  breakDuration = mins;
  updateTrayMenu();
}

function startWorkTimer() {
  if (workTimer) clearTimeout(workTimer);
  workTimer = setTimeout(() => {
    triggerBreak();
  }, workInterval * 60 * 1000);
}

function triggerBreak() {
  if (workTimer) clearTimeout(workTimer);
  if (mainWindow) {
    mainWindow.show();
  }
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  startWorkTimer();

  ipcMain.handle('get-break-duration', () => breakDuration);
  
  ipcMain.on('end-break', () => {
    mainWindow.hide();
    startWorkTimer();
  });

  ipcMain.on('skip-break', () => {
    mainWindow.hide();
    startWorkTimer();
  });
});
