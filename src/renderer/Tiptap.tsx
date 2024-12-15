import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import StarterKit from '@tiptap/starter-kit';
import ListKeymap from '@tiptap/extension-list-keymap'
import { Markdown } from 'tiptap-markdown';
import React from 'react';

// define your extension array
const extensions = [
  StarterKit,
  Markdown,
  ListKeymap,
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
];

// const content = '<p>Hello World!</p>';

interface TiptapProps {
  initialContent: string;
  onContentChange: (content: string) => void;
}

const Tiptap: React.FC<TiptapProps> = ({ initialContent, onContentChange }) => {
  const editor = useEditor({
    extensions,
    content: initialContent,
    onUpdate: ({ editor }) => {
      onContentChange?.(editor.storage.markdown.getMarkdown());
    },
  });

  useEffect(() => {
    console.log('Tiptap.tsx useEffect');
    console.log(editor);
    console.log(initialContent);

    if (editor && initialContent) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  return (
    <div className="tiptap-editor">
      <EditorContent editor={editor} />
    </div>
  );
};

export default Tiptap;
