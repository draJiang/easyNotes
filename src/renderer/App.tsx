import React, { useEffect, useState, useCallback } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import './App.css';
import Tiptap from './Tiptap';
import { useDebouncedCallback } from "use-debounce";

function Hello() {
  const [content, setContent] = useState<string>('123');

  // 自动保存函数
  const saveContent = useCallback(async (newContent: string) => {
    try {
      window.electron.ipcRenderer.sendMessage('save-data', newContent);
      console.log('内容已保存');
    } catch (error) {
      console.error('保存失败:', error);
    }
  }, []);

  // 使用 debounce 创建延迟保存函数
  const debouncedSave = useCallback(
    useDebouncedCallback((newContent: string) => {
      saveContent(newContent);
    }, 1000),
    [saveContent],
  );

  // 内容变化处理函数
  const handleContentChange = (newContent: string) => {
    // setContent(newContent);
    debouncedSave(newContent);
  };

  // 加载数据
  useEffect(() => {
    window.electron.ipcRenderer.sendMessage('load-data', ['hello world!']);
    window.electron.ipcRenderer.once('load-data', (...args: unknown[]) => {
      // eslint-disable-next-line no-console
      console.log('App.tsx:');
      console.log(args[0]);
      setContent(args[0] as string);
    });
  }, []);

  return (
    <div>
      <Tiptap initialContent={content} onContentChange={handleContentChange} />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
