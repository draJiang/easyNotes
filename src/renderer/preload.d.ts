import { ElectronHandler } from '../main/preload';

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    electron: ElectronHandler;
    
    // ipcRenderer: {
    //   sendMessage(channel: string, ...args: unknown[]): void;
    //   on(channel: string, func: (...args: unknown[]) => void): (() => void);
    //   once(channel: string, func: (...args: unknown[]) => void): void;
    //   invoke(channel: string, ...args: unknown[]): Promise<any>;
    // };
  }
}

export {};
