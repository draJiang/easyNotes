import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Tiptap, { TiptapRef } from './Tiptap';
import { useDebouncedCallback } from 'use-debounce';
import { escape } from 'querystring';

function Hello() {
  const [content, setContent] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [searchIndexAndLength, setSearchIndexAndLength] = useState<string>();
  const [showSearchBox, setShowSearchBox] = useState<boolean>(false);
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
    const r = editorRef.current?.search(keyword);

    // editorRef.current?.goToNext();
  };

  // 监听回车事件
  const handleSearchInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const keyword = e.currentTarget.value;
    console.log(e);
    if ((e.nativeEvent as KeyboardEvent).isComposing) {
      return;
    }

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
        if (r.results.length === 0) {
          setSearchIndexAndLength('');
        } else {
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
    // Search
    window.electron.ipcRenderer.on('shortcut', handleShortcut);

    return () => {
      window.electron.ipcRenderer.off('shortcut', handleShortcut);
    };
  }, []);

  const handleShortcut = (...args: unknown[]) => {
    const type = args[0];

    switch (type) {
      case 'toggleSearchBox':
        console.log('toggleSearchBox');

        const isShowSearchBox = document.getElementById('search_input');

        if (!isShowSearchBox) {
          toggleSearchBox();
        } else {
          if (document.activeElement?.id === 'search_input') {
            // 如果当前焦点在搜索输入框内
            // 关闭搜索窗口
            toggleSearchBox();
          } else {
            document.getElementById('search_input')?.focus();
          }
        }

        break;
      case 'escape':
        console.log(document.activeElement?.id);
        if (document.activeElement?.id === 'search_input') {
          toggleSearchBox();
        } else {
          // 如果 search box 没有获取焦点，则关闭窗口
          window.electron.ipcRenderer.sendMessage('shortcut', 'escape');
        }

        break;
      default:
        break;
    }
  };

  const toggleSearchBox = () => {
    setShowSearchBox((old) => {
      return old === true ? false : true;
    });
    setSearchIndexAndLength('');
    setSearchKeyword('');
    editorRef.current?.search('');
  };

  return (
    <div>
      {showSearchBox && (
        <div
          className="search_box"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'end',
            gap: '4px',
            position: 'fixed',
            top: '0',
            right: '0',
            padding: '0.5rem',
            zIndex: '999',
          }}
        >
          <input
            id="search_input"
            placeholder="Search"
            autoFocus={true}
            onKeyDown={handleSearchInput}
          />
          <div
            style={{
              color: '#666',
              // textAlign: 'left',
              position: 'absolute',
              right: '0.85rem',
              fontSize: '0.85rem',
            }}
          >
            {searchIndexAndLength && `${searchIndexAndLength}`}
          </div>
        </div>
      )}
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
