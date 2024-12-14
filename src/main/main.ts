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
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

import * as fs from 'fs';

// 获取应用数据目录
const filePath = '/Users/jiangzilong/Documents/notes.md'

// 设置 IPC 监听器
function setupIPCHandlers() {
  // 保存数据
  ipcMain.handle('save-data', async (_, content: string) => {
    try {
      await fs.promises.writeFile(filePath, content, 'utf-8');
      return { success: true };
    } catch (error: unknown) {
      console.error('保存文件失败:', error);
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  // 读取数据
  ipcMain.handle('load-data', async () => {
    console.log('main.ts load-data:');
    
    try {
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        return { content: '', isNew: true };
      }
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return { content, isNew: false };
    } catch (error: unknown) {
      console.error('读取文件失败:', error);
      if (error instanceof Error) {
        return { content: '', error: error.message };
      }
      return { content: '', error: 'Unknown error occurred' };
    }
  });
}



// =============

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  
  console.log('main.ts ipcMain.on:')
  console.log(msgTemplate(arg));
  
  event.reply('ipc-example', msgTemplate('pong'));
});

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

  mainWindow = new BrowserWindow({
    show: false,
    width: 424,
    height: 628,
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
  mainWindow.setAlwaysOnTop(true, 'floating');
  // 确保窗口在所有工作区可见，包括全屏应用上方
  mainWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true
  });

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
    setupIPCHandlers();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
