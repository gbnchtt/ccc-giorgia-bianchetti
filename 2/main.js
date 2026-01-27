const {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  screen,
  nativeImage,
} = require("electron");
const path = require("path");
const si = require("systeminformation");

let mainWindow;
let tray;
let trayAnimationInterval;

const w = 500;
const h = 320;

const trayFrames = [
  "icon-01.png",
  "icon-02.png",
  "icon-03.png",
];

// 👇 Funzione per creare la finestra principale
function createWindow() {
  mainWindow = new BrowserWindow({
    width: w,
    height: h,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

  mainWindow.loadFile("renderer/index.html");
  return mainWindow;
}

// 👇 Finestra impostazioni
function createSettingsWindow() {
  const win = new BrowserWindow({
    width: 300,
    height: 120,
    title: "Index Settings",
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile("renderer/settings.html");
}

// ✅ Tray icon animata
function animateTrayIcon() {
  let frame = 0;

  trayAnimationInterval = setInterval(() => {
    const iconPath = path.join(__dirname, "assets", trayFrames[frame]);
    const image = nativeImage
      .createFromPath(iconPath)
      .resize({ width: 16, height: 16 });
    tray.setImage(image);
    frame = (frame + 1) % trayFrames.length;
  }, 250);
}

// ✅ Funzioni esposte via IPC — SOLO QUI
ipcMain.handle("get-battery", async () => await si.battery());
ipcMain.handle("get-cpu", async () => await si.currentLoad());
ipcMain.handle("get-mem", async () => await si.mem());
ipcMain.handle("get-cpu-info", async () => await si.cpu());
ipcMain.handle("get-processes", async () => await si.processes());
ipcMain.handle("get-time-info", async () => await si.time());
ipcMain.handle("get-mouse-position", () => screen.getCursorScreenPoint());
ipcMain.handle("move-window", (event, x, y) => {
  if (mainWindow) {
    mainWindow.setPosition(Math.round(x), Math.round(y));
  }
});

// ✅ Avvio app
app.whenReady().then(() => {
  const initialIcon = nativeImage
    .createFromPath(path.join(__dirname, "assets", "icon-0.png"))
    .resize({ width: 16, height: 16 });

  tray = new Tray(initialIcon);
  tray.setToolTip("Is active!");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Open Settings", click: () => ipcMain.emit("open-settings") },
      { type: "separator" },
      { label: "Quit", role: "quit" },
    ])
  );

  const win = createWindow();
  animateTrayIcon();

  ipcMain.on("open-settings", () => createSettingsWindow());
  ipcMain.on("open-mouse-position", () => createMousePositionWindow?.());
});

// ✅ Chiudi tutto
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
