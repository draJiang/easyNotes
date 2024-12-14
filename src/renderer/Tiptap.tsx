import { useEffect, useState } from 'react';
import {
  useEditor,
  EditorContent,
  FloatingMenu,
  BubbleMenu,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import React from 'react';

// define your extension array
const extensions = [StarterKit];

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
      onContentChange?.(editor.getHTML());
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
    <div className='tiptap-editor'>
      <EditorContent editor={editor} />
    </div>
  );
};

export default Tiptap;
