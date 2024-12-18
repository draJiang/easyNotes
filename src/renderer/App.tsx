import React, { useEffect, useState, useCallback } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import './App.css';
import Tiptap from './Tiptap';
import { useDebouncedCallback } from 'use-debounce';

function Hello() {
  const [content, setContent] = useState<string>('loading...');
  const [serachResults, setSerachResults] = useState<HTMLParagraphElement[]>(
    [],
  );
  const [positionIndex, setPositionIndex] = useState<number>(0);

  const [serachKeyword, setSerachKeyword] = useState<string>('');
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
      // 保存数据
      saveContent(newContent);
    }, 500),
    [saveContent],
  );

  // 内容变化处理函数
  const handleContentChange = (newContent: string) => {
    // setContent(newContent);
    debouncedSave(newContent);
  };

  // // 执行搜索逻辑
  // const handleSearch = (keyword: string) => {
  //   let results = [];
  //   console.log('执行搜索:', keyword);
  //   const editorDom = document.getElementsByTagName('p');

  //   results = Array.from(editorDom).filter(
  //     (element: HTMLParagraphElement) =>
  //       element.innerText.toLowerCase().indexOf(keyword.toLowerCase()) > -1,
  //   );

  //   setSerachResults(results);
  //   console.log(results);
  //   scrollToSearchResult(results[0]);
  // };

  // // 监听回车事件
  // const handleSearchInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
  //   if (e.key === 'Enter') {
  //     setSerachKeyword(e.currentTarget.value);
  //     // handleSearch(e.currentTarget.value);
  //   }
  // };

  // // 滚动到目标搜索结果
  // const scrollToSearchResult = (element: HTMLElement) => {
  //   element.scrollIntoView({
  //     behavior: 'smooth',
  //     block: 'center',
  //   });
  // };

  // 加载数据
  useEffect(() => {
    // 请求 main.ts 加载数据
    window.electron.ipcRenderer.sendMessage('load-data', ['hello world!']);
    // 监听 main.ts 的响应
    window.electron.ipcRenderer.once('load-data', (...args: unknown[]) => {
      // eslint-disable-next-line no-console
      setContent(args[0] as string);
    });
  }, []);

  return (
    <div>
      {/* <div
        className="search_box"
        style={{
          position: 'sticky',
          top: '0',
          padding: '1rem',
          background: '#fff',
          zIndex: '999',
        }}
      >
        <input placeholder="Search" onKeyDown={handleSearchInput} />
      </div> */}
      <Tiptap
        initialContent={content}
        serachKeyword={serachKeyword}
        onContentChange={handleContentChange}
      />
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
