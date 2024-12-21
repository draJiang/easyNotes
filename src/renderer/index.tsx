import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(<App />);

// calling IPC exposed from preload script
window.electron.ipcRenderer.once('ipc-example', (arg) => {
  // eslint-disable-next-line no-console
  // console.log('index.tsx:')
  // console.log(arg);
});
// console.log('index.tsx sendMessage')
window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);
