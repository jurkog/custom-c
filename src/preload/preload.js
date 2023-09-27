const { contextBridge, ipcRenderer } = require('electron')
const { electronAPI } = require('@electron-toolkit/preload')

const api = {
  cursorReset: () => ipcRenderer.invoke('cursor:reset'),
  cursorSet: (options) => ipcRenderer.invoke('cursor:set', options),
  getCurrentDir: () => ipcRenderer.invoke('current_dir'),
}

const EXPOSE_PRELOAD = {
  electron: electronAPI,
  api: api,
}

//  Expose all to renderer
try {
  for (let [key, value] of Object.entries(EXPOSE_PRELOAD)) {
    if (process.contextIsolated) {
      contextBridge.exposeInMainWorld(key, value)
    } else {
      window[key] = value
    }
  }
} catch (error) {
  console.error(error)
}
