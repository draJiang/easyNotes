/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow,screen, shell, ipcMain } from 'electron';
import electronLocalShortcut from 'electron-localshortcut';

import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

import * as fs from 'fs';
import windowStateKeeper from 'electron-window-state';

// 应用数据
const filePath = '/Users/jiangzilong/Documents/notes.md'


ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  
  // console.log('main.ts ipcMain.on:')
  console.log(msgTemplate(arg));
  
  event.reply('ipc-example', msgTemplate('pong'));
});

// 保存数据
ipcMain.on('save-data', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  
  console.log('main.ts ipcMain.on:')
  console.log(msgTemplate(arg));
  
  try {
    await fs.promises.writeFile(filePath, arg, 'utf-8');
    return { success: true };
  } catch (error: unknown) {
    console.error('保存文件失败:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error occurred' };
  }
  
});
// 加载数据
ipcMain.on('load-data', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  
  console.log('main.ts ipcMain.on:')
  console.log(msgTemplate(arg));
  
  try {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return { content: '', isNew: true };
    }
    const content = await fs.promises.readFile(filePath, 'utf-8');
    
    console.log('content:');
    console.log(content);
    event.reply('load-data', content);
    return { content, isNew: false };
  } catch (error: unknown) {
    console.error('读取文件失败:', error);
    if (error instanceof Error) {
      return { content: '', error: error.message };
    }
    return { content: '', error: 'Unknown error occurred' };
  }
  
});

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}



let mainWindow: BrowserWindow | null = null;



if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth } = primaryDisplay.workAreaSize;
  let mainWindowState = windowStateKeeper({
    defaultWidth: 320,
    defaultHeight: 520
  });
  // 设置窗口的初始样式、位置
  mainWindow = new BrowserWindow({
    show: false,
    width: mainWindowState.width,
    height: mainWindowState.height,
    // 计算右上角位置
    // x: screenWidth - 320 - 40, // 屏幕宽度 - 窗口宽度 - 右边距（20px）
    x:mainWindowState.x,
    y:mainWindowState.y,
    alwaysOnTop: true, // 设置窗口始终置顶
    visualEffectState: 'active', // 保持视觉效果活跃
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));
  // 窗口浮动
  mainWindow.setAlwaysOnTop(true, 'floating');
  // 确保窗口在所有工作区可见，包括全屏应用上方
  mainWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true
  });

  mainWindowState.manage(mainWindow);


  // 注册快捷键
  electronLocalShortcut.register(mainWindow, ['CommandOrControl+W', 'Escape'], () => {
    // mainWindow!.close();
    // mainWindow?.hide()
    mainWindow?.minimize();
  });

  // test
  // console.log(mainWindow.webContents);  

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    // electronLocalShortcut.unregisterAll(mainWindow!);
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });
  
  

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */


app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {

    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });

  })
  .catch(console.log);
