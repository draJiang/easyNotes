import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import './App.css';
import Tiptap, { TiptapRef } from './Tiptap';
import { useDebouncedCallback } from 'use-debounce';

function Hello() {
  const [content, setContent] = useState<string>('loading...');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [searchIndexAndLength, setSearchIndexAndLength] = useState<string>();
  const editorRef = useRef<TiptapRef | null>(null);

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

  // 执行搜索逻辑
  const handleSearch = (keyword: string) => {
    console.log('执行搜索:', keyword);
    console.log(editorRef.current);

    const r = editorRef.current?.search(keyword);
    console.log('handleSearch r:');
    console.log(r);

    // editorRef.current?.goToNext();
  };

  // 监听回车事件
  const handleSearchInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const keyword = e.currentTarget.value;

    if (e.key === 'Enter') {
      if (e.shiftKey) {
        //Shirt+Enter
        editorRef.current?.goToPrevious();
      } else {
        if (searchKeyword !== keyword) {
          // 关键词变化，则执行搜索
          setSearchKeyword(keyword);
          handleSearch(keyword);
        } else {
          // 关键词未变化，则定位到下一个搜索结果
          editorRef.current?.goToNext();
        }
      }

      console.log('setSearchResults');
      const r: any = editorRef.current?.getSerachResults();

      if (r) {
        if(r.results.length===0){
          setSearchIndexAndLength('');
        }else{
          setSearchIndexAndLength(`${r.resultIndex + 1}/${r.results.length}`);
        }
        
      }
    }
  };

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
      <div
        className="search_box"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          position: 'sticky',
          top: '0',
          padding: '1rem',
          background: '#fff',
          zIndex: '999',
        }}
      >
        <input placeholder="Search" onKeyDown={handleSearchInput} />
        <div>{searchIndexAndLength && `${searchIndexAndLength}`}</div>
      </div>
      <Tiptap
        ref={editorRef}
        initialContent={content}
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
