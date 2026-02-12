const { app, BrowserWindow } = require("electron");
const path = require("path");

if (process.env.NODE_ENV === "development") {
  try {
    require("electron-reload")(__dirname, {
      electron: path.join(__dirname, "node_modules", ".bin", "electron")
    });
  } catch (err) {
    console.log("Reload disabled");
  }
}

function createWindow() {
  const win = new BrowserWindow({
    fullscreen: false,
    frame: true,
    resizable: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadFile("renderer/pages/splash.html");
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
