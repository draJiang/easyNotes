import { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import StarterKit from '@tiptap/starter-kit';
import ListKeymap from '@tiptap/extension-list-keymap';
import { Markdown } from 'tiptap-markdown';
import React from 'react';
import SearchNReplace from '@sereneinserenade/tiptap-search-and-replace';

// define your extension array
const extensions = [
  StarterKit,
  Markdown,
  ListKeymap,
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
  SearchNReplace.configure({
    searchResultClass: 'search-result', // class to give to found items. default 'search-result'
    // caseSensitive: false, // no need to explain
    disableRegex: false, // also no need to explain
  }),
];

// const content = '<p>Hello World!</p>';

interface TiptapProps {
  initialContent: string;
  serachKeyword: string;
  onContentChange: (content: string) => void;
}

const Tiptap: React.FC<TiptapProps> = ({
  initialContent,
  serachKeyword,
  onContentChange,
}) => {
  const editor = useEditor({
    extensions,
    content: initialContent,
    onUpdate: ({ editor }) => {
      onContentChange?.(editor.storage.markdown.getMarkdown());
    },
  });

  useEffect(() => {
    console.log('Tiptap.tsx useEffect');
    // console.log(editor);
    // console.log(initialContent);

    if (editor && initialContent) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  // 高亮
  useEffect(() => {
    if (!editor) return;
    editor.commands.setSearchTerm(serachKeyword);
  }, [serachKeyword]);

  return (
    <div className="tiptap-editor" style={{ padding: '0 1rem' }}>
      <EditorContent editor={editor} />
    </div>
  );
};

export default Tiptap;
