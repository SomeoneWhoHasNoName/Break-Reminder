const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getBreakDuration: () => ipcRenderer.invoke('get-break-duration'),
  endBreak: () => ipcRenderer.send('end-break'),
  skipBreak: () => ipcRenderer.send('skip-break')
});
