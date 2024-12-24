import { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Link from '@tiptap/extension-link';
import StarterKit from '@tiptap/starter-kit';
import ListKeymap from '@tiptap/extension-list-keymap';
import { Markdown } from 'tiptap-markdown';
import React, { forwardRef, useImperativeHandle } from 'react';
import SearchNReplace from '@sereneinserenade/tiptap-search-and-replace';
import { TextHighlight, HighlightRule } from './extentions/TextHighlight';
import { Range } from '@tiptap/core';

const highlightRules: HighlightRule[] = [
  {
    pattern: /TODO/g,
    style: {
      color: '#fff',
      background: '#2B71DB',
    },
    label: 'todo',
    priority: 1,
    click: 'DONE',
  },
  {
    pattern: /DONE/g,
    style: {
      color: '#fff',
      background: '#4DA764',
    },
    label: 'todo',
    priority: 2,
    click: 'TODO',
  },
  {
    pattern: /#grimo/g,
    style: {
      color: '#633DA2',
      fontWeight: '500',
    },
    label: 'tag',
    priority: 3,
    click: '#home',
  },
  {
    pattern: /#home/g,
    style: {
      color: '#CA8A04',
      fontWeight: '500',
    },
    label: 'tag',
    priority: 4,
    click: '#grimo',
  },
];

// define your extension array
const extensions = [
  StarterKit,
  Markdown,
  ListKeymap,
  TaskList,
  Link,
  TaskItem.configure({
    nested: true,
  }),
  SearchNReplace.configure({
    searchResultClass: 'search-result', // class to give to found items. default 'search-result'
    // caseSensitive: false, // no need to explain
    disableRegex: false, // also no need to explain
  }),
  TextHighlight.configure({
    rules: highlightRules,
  }),
];

interface TiptapProps {
  initialContent: string | null;
  onContentChange: (content: string) => void;
}

// 定义 Ref 接口
export interface TiptapRef {
  search: (keyword: string) => void;
  goToNext: () => void;
  goToPrevious: () => void;
  getSerachResults: () => void;
}

const Tiptap = forwardRef<TiptapRef, TiptapProps>(
  ({ initialContent, onContentChange }, ref) => {
    const editor = useEditor({
      // editable: initialContent !== null, // 加载中禁止编辑，避免数据丢失
      extensions,
      autofocus: 'start',
      content: initialContent,
      onUpdate: ({ editor }) => {
        onContentChange?.(editor.storage.markdown.getMarkdown());
      },
    });

    useEffect(() => {
      console.log(ref);

      if (editor && initialContent) {
        editor.commands.setContent(initialContent);
      }
    }, [editor, initialContent]);

    const search = (keyword: string) => {
      console.log('handleSerach');

      if (!editor) return;

      editor.commands.setSearchTerm(keyword);
      editor.commands.resetIndex();

      goToSelection();
    };

    // 下一个
    const goToNext = () => {
      if (!editor) return;
      editor.commands.nextSearchResult();
      goToSelection();
      console.log('goToNext');
    };

    // 上一个
    const goToPrevious = () => {
      if (!editor) return;
      editor.commands.previousSearchResult();
      goToSelection();
      console.log('goToPrevious');
    };

    // 获取搜索结果信息
    const getSerachResults = () => {
      if (!editor) return;
      return editor.storage.searchAndReplace;
    };

    const goToSelection = () => {
      if (!editor) return;

      const { results, resultIndex } = editor.storage.searchAndReplace;
      const position: Range = results[resultIndex];

      if (!position) return;

      editor.commands.setTextSelection(position);

      const { node } = editor.view.domAtPos(editor.state.selection.anchor);
      node instanceof HTMLElement &&
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    useImperativeHandle(ref, () => ({
      search,
      goToNext,
      goToPrevious,
      getSerachResults,
    }));

    return (
      <div className="tiptap-editor" style={{ padding: '1rem' }}>
        {initialContent === null ? (
          'loading...'
        ) : (
          <EditorContent editor={editor} />
        )}
      </div>
    );
  },
);

export default Tiptap;
