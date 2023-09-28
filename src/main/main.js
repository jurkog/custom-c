const {
    shell,
    app,
    BrowserWindow,ipcMain
} = require("electron");

const fs = require('fs')
const path = require('path')


const { electronApp, optimizer } = require('@electron-toolkit/utils')


const isDevelopment = process.env.NODE_ENV === "development";

const  Cursor  =  require('./cursor.js');
const  Registry  =  require('./registry.js');
//import Registry from './registry.js';

// fix: context menu shown behind devtools
app.commandLine.appendSwitch('disable-features', 'WidgetLayering');



function createWindow() {
    // Create a new window
    const window = new BrowserWindow({
        width: 700,
    minWidth: 700,
    height: 580,
    minHeight: 580,
    show: false,
   // autoHideMenuBar: true,
    ...(process.platform === 'linux'
      ? {
          icon: path.join(__dirname, '../resources/icon.png')
        }
      : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      sandbox: false
    }
    });

    // Event listeners on the window
    window.webContents.on("did-finish-load", () => {
        window.show();
        window.focus();
    });


    window.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
      })
   
      // Load our HTML file
      if (isDevelopment) {
        window.loadURL("http://localhost:40992");
    } else {
        console.log("prod");
        // Load our HTML file
    window.loadFile("out/index.html");
    }
}

// This method is called when Electron
// has finished initializing
app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.kyolabs.customcursor')

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })
    createWindow();

    app.on("activate", () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
    if (process.platform !== "darwin") {
        app.quit();
    }
});


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