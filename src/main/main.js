const fs = require('fs')
const path = require('path')
const koffi = require('koffi');

const { app, shell, BrowserWindow, ipcMain } = require('electron')
const { electronApp, optimizer, is } = require('@electron-toolkit/utils')

import Cursor from './cursor.js';
import Registry from './registry.js';

// fix: context menu shown behind devtools
app.commandLine.appendSwitch('disable-features', 'WidgetLayering');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 700,
    minWidth: 700,
    height: 580,
    minHeight: 580,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux'
      ? {
          icon: path.join(__dirname, '../resources/icon.png')
        }
      : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })
  
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
  
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  return mainWindow;
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.kyolabs.customcursor')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const mainWin = createWindow()

  ipcMain.handle('cursor:reset', async function (e) {
    try {
      Registry.write(Registry.HKEY.HKEY_CURRENT_USER, "Control Panel\\Cursors", "Arrow", Registry.VALUE_TYPE.REG_EXPAND_SZ , "%SystemRoot%\\cursors\\aero_arrow.cur");
      Cursor.restoreSystemCursor();
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: error.toString(),
      };
    }

    return {
      success: true,
      message: 'Cursor reset successfuly',
    };
  });

  ipcMain.handle('cursor:set', async (e, data) => {
    try {
      let cursorPath = path.resolve("./custom.cur");
      let cursorData = await Cursor.imageToCursorData(data.path, data);
      fs.writeFileSync(cursorPath, cursorData);
      Cursor.setFromFile(cursorPath, Cursor.cursorType.Normal);
      Registry.write(Registry.HKEY.HKEY_CURRENT_USER, "Control Panel\\Cursors", "Arrow", Registry.VALUE_TYPE.REG_EXPAND_SZ , data.permanent && fs.existsSync(cursorPath) ? cursorPath : "%SystemRoot%\\cursors\\aero_arrow.cur");
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: error.toString(),
      };
    }

    return {
      success: true,
      message: 'Cursor set successfuly',
    };
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
