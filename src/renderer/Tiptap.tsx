import { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import StarterKit from '@tiptap/starter-kit';
import ListKeymap from '@tiptap/extension-list-keymap';
import { Markdown } from 'tiptap-markdown';
import React from 'react';
import SearchNReplace from '@sereneinserenade/tiptap-search-and-replace';
import { Extension } from '@tiptap/core';
import type { EditorView } from 'prosemirror-view';

export interface HighlightRule {
  pattern: RegExp | string;
  style: {
    color?: string;
    fontWeight?: string;
    backgroundColor?: string;
    fontStyle?: string;
    textDecoration?: string;
    [key: string]: string | undefined;
  };
  click: string;
  label?: string; // 规则说明
  priority?: number; // 优先级，用于处理重叠规则
}

export interface HighlightExtensionOptions {
  rules: HighlightRule[];
  defaultStyle?: HighlightRule['style'];
  className?: string;
}

interface DecorationSpec {
  class?: string;
  style?: string;
  [key: string]: any;
}

// import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
// import type { HighlightRule, HighlightExtensionOptions } from '../types'

class HighlightPluginState {
  decorationSet: DecorationSet;

  constructor(decorationSet: DecorationSet) {
    this.decorationSet = decorationSet;
  }
}

export const TextHighlight = Extension.create<HighlightExtensionOptions>({
  name: 'textHighlight',

  addOptions() {
    return {
      rules: [],
      defaultStyle: {
        color: 'inherit',
        fontWeight: 'inherit',
      },
    };
  },

  addProseMirrorPlugins() {
    const { rules, defaultStyle } = this.options;

    return [
      new Plugin({
        key: new PluginKey('text-highlight'),
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, oldSet) {
            // 处理文档映射
            let set = oldSet.map(tr.mapping, tr.doc);

            // 如果文档没有改变，保持现有装饰
            if (!tr.docChanged) {
              return set;
            }

            // 清除所有装饰
            set = DecorationSet.empty;
            const decorations: Decoration[] = [];

            // 按优先级排序规则
            const sortedRules = [...rules].sort(
              (a, b) => (b.priority || 0) - (a.priority || 0),
            );

            // 处理文档中的每个文本节点
            tr.doc.descendants((node, pos) => {
              if (!node.isText) return;

              const text = node.text as string;
              const matches = new Map<number, Set<number>>(); // 用于跟踪已匹配的位置

              sortedRules.forEach((rule) => {
                const pattern =
                  typeof rule.pattern === 'string'
                    ? new RegExp(rule.pattern, 'g')
                    : new RegExp(rule.pattern.source, rule.pattern.flags);

                let match: RegExpExecArray | null;
                while ((match = pattern.exec(text)) !== null) {
                  const from = pos + match.index;
                  const to = from + match[0].length;

                  // 检查是否与更高优先级的规则重叠
                  let hasOverlap = false;
                  for (const [existingFrom, existingTos] of matches.entries()) {
                    for (const existingTo of existingTos) {
                      if (
                        (from >= existingFrom && from < existingTo) ||
                        (to > existingFrom && to <= existingTo)
                      ) {
                        hasOverlap = true;
                        break;
                      }
                    }
                    if (hasOverlap) break;
                  }

                  if (!hasOverlap) {
                    // 记录这个匹配的位置
                    if (!matches.has(from)) {
                      matches.set(from, new Set());
                    }
                    matches.get(from)?.add(to);

                    // 创建装饰
                    const style = {
                      ...defaultStyle,
                      ...rule.style,
                    };

                    const styleString = Object.entries(style)
                      .filter(([_, value]) => value !== undefined)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join('; ');

                    decorations.push(
                      Decoration.inline(from, to, {
                        style: styleString,
                        class: 'highlight-match',
                        'data-highlight-rule': rule.label || 'default',
                      }),
                    );
                  }
                }
              });
            });

            return DecorationSet.create(tr.doc, decorations);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
          handleClick(
            view: EditorView,
            pos: number,
            event: MouseEvent,
          ): boolean {
            const target = event.target as HTMLElement;
            if (!target.classList.contains('highlight-match')) {
              return false;
            }

            const ruleLabel = target.getAttribute('data-highlight-rule');
            if (!ruleLabel) return false;

            // 获取当前文本
            const currentText = target.textContent;
            if (!currentText) return false;

            // 找到匹配的规则
            const rule = rules.find((r) => {
              const pattern =
                typeof r.pattern === 'string'
                  ? new RegExp(`^${r.pattern}$`)
                  : new RegExp(
                      `^${r.pattern.source}$`,
                      r.pattern.flags.replace('g', ''),
                    );
              return pattern.test(currentText) && r.click;
            });

            if (!rule?.click) return false;

            const decorations = this.getState(view.state);
            if (!decorations) return false;

            try {
              const found = decorations.find(pos);
              const decoration = found.find((dec) => {
                return dec.from <= pos && dec.to >= pos;
              });

              if (!decoration) return false;

              const { from, to } = decoration;

              // 验证位置的有效性
              if (from >= to || from < 0 || to > view.state.doc.content.size) {
                return false;
              }

              // 添加点击动画效果
              target.style.transform = 'scale(0.95)';
              setTimeout(() => {
                target.style.transform = 'scale(1)';
              }, 100);

              // 替换文本
              view.dispatch(
                view.state.tr.replaceWith(
                  from,
                  to,
                  view.state.schema.text(rule.click),
                ),
              );

              return true;
            } catch (error) {
              console.error('Error handling highlight click:', error);
              return false;
            }
          },
        },
      }),
    ];
  },
});

// ==========

const highlightRules: HighlightRule[] = [
  {
    pattern: /TODO/g,
    style: {
      color: '#fff',
      background: '#2B71DB',
    },
    label: 'todo',
    priority: 3,
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
];

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
  TextHighlight.configure({
    rules: highlightRules,
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
    autofocus: 'start',
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

  // // 高亮
  // useEffect(() => {
  //   if (!editor) return;
  //   editor.commands.setSearchTerm(serachKeyword);
  // }, [serachKeyword]);

  return (
    <div className="tiptap-editor" style={{ padding: '1rem' }}>
      <EditorContent editor={editor} />
    </div>
  );
};

export default Tiptap;
