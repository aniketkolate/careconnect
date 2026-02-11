const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  log: (msg) => console.log(msg)
});
