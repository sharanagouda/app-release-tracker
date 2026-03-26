import React, { useState, useRef, useEffect } from 'react';
import {
  Edit,
  MoreVertical,
  Printer,
  Link2,
  History,
  Trash2,
  Eye,
  Bold,
  Italic,
  Code,
  List,
  ListOrdered,
  Table,
  Heading,
  LinkIcon,
  Paperclip,
  Hash,
  Users,
  MoreHorizontal,
  X,
  Send,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { WikiPage, WikiComment } from '../../types/wiki';

interface WikiContentProps {
  page: WikiPage | null;
  isEditing: boolean;
  onStartEdit: () => void;
  onSaveEdit: (title: string, content: string) => void;
  onCancelEdit: () => void;
  onDeletePage: (page: WikiPage) => void;
  onAddComment: (content: string) => void;
  onDeleteComment: (commentId: string) => void;
  isAdmin: boolean;
  darkMode: boolean;
  user: any;
}

// Simple markdown renderer
const renderMarkdown = (text: string, darkMode: boolean): string => {
  if (!text) return '';

  let html = text;

  // Escape HTML
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-5 mb-2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>');

  // Bold and Italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="rounded-lg p-4 my-3 overflow-x-auto ${
      darkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-100 text-gray-800'
    }"><code>${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, `<code class="px-1.5 py-0.5 rounded text-sm ${
    darkMode ? 'bg-gray-700 text-pink-300' : 'bg-gray-100 text-pink-600'
  }">$1</code>`);

  // Links
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
    `<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">$1 <svg class="inline w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a>`
  );

  // Auto-link URLs
  html = html.replace(
    /(?<!["\(])(https?:\/\/[^\s<]+)/g,
    `<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">$1 <svg class="inline w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a>`
  );

  // Unordered lists
  html = html.replace(/^[\-\*] (.+)$/gm, '<li class="ml-4">• $1</li>');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>');

  // Horizontal rule
  html = html.replace(/^={3,}$/gm, `<hr class="my-4 ${darkMode ? 'border-gray-600' : 'border-gray-300'}" />`);
  html = html.replace(/^-{3,}$/gm, `<hr class="my-4 ${darkMode ? 'border-gray-600' : 'border-gray-300'}" />`);

  // Simple table support (pipe-delimited)
  const tableRegex = /(\|.+\|[\r\n]+)+/g;
  html = html.replace(tableRegex, (match) => {
    const rows = match.trim().split('\n').filter(r => r.trim());
    if (rows.length < 2) return match;

    // Check if second row is separator
    const isSeparator = (row: string) => /^\|[\s\-:]+\|$/.test(row.replace(/\|/g, '|').trim());
    const hasSeparator = rows.length > 1 && isSeparator(rows[1]);

    let tableHtml = `<table class="border-collapse my-4 w-auto ${darkMode ? 'border-gray-600' : 'border-gray-300'}">`;

    rows.forEach((row, idx) => {
      if (hasSeparator && idx === 1) return; // Skip separator row

      const cells = row.split('|').filter(c => c.trim() !== '');
      const isHeader = hasSeparator && idx === 0;
      const tag = isHeader ? 'th' : 'td';
      const headerClass = isHeader
        ? darkMode
          ? 'bg-gray-700 font-semibold'
          : 'bg-orange-50 font-semibold'
        : '';

      tableHtml += '<tr>';
      cells.forEach((cell) => {
        tableHtml += `<${tag} class="border px-3 py-2 text-sm ${headerClass} ${
          darkMode ? 'border-gray-600' : 'border-gray-300'
        }">${cell.trim()}</${tag}>`;
      });
      tableHtml += '</tr>';
    });

    tableHtml += '</table>';
    return tableHtml;
  });

  // Line breaks (preserve double newlines as paragraphs)
  html = html.replace(/\n\n/g, '</p><p class="mb-3">');
  html = html.replace(/\n/g, '<br/>');

  // Wrap in paragraph
  html = `<p class="mb-3">${html}</p>`;

  return html;
};

export const WikiContent: React.FC<WikiContentProps> = ({
  page,
  isEditing,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeletePage,
  onAddComment,
  onDeleteComment,
  isAdmin,
  darkMode,
  user,
}) => {
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [commentText, setCommentText] = useState('');
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && page) {
      setEditTitle(page.title);
      setEditContent(page.content || '');
    }
  }, [isEditing, page]);

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editContent.substring(start, end);
    const newText =
      editContent.substring(0, start) +
      prefix +
      (selectedText || 'text') +
      suffix +
      editContent.substring(end);

    setEditContent(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selectedText || 'text').length
      );
    }, 0);
  };

  if (!page) {
    return (
      <div className={`flex-1 flex items-center justify-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        <div className="text-center">
          <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Select a page</h3>
          <p className="text-sm">Choose a page from the sidebar or create a new one</p>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Editor Header */}
        <div className={`flex items-center justify-between px-6 py-3 border-b ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
        }`}>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className={`text-xl font-bold flex-1 mr-4 px-2 py-1 rounded border ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Page title"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={onCancelEdit}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                darkMode
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Close
            </button>
            <button
              onClick={() => onSaveEdit(editTitle, editContent)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className={`flex items-center gap-1 px-6 py-2 border-b overflow-x-auto ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <button
            onClick={() => insertMarkdown('**', '**')}
            className={`p-2 rounded transition-colors ${
              darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'
            }`}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertMarkdown('*', '*')}
            className={`p-2 rounded transition-colors ${
              darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'
            }`}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertMarkdown('[', '](url)')}
            className={`p-2 rounded transition-colors ${
              darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'
            }`}
            title="Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertMarkdown('`', '`')}
            className={`p-2 rounded transition-colors ${
              darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'
            }`}
            title="Inline Code"
          >
            <Code className="w-4 h-4" />
          </button>
          <div className={`w-px h-5 mx-1 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
          <button
            onClick={() => insertMarkdown('- ', '')}
            className={`p-2 rounded transition-colors ${
              darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'
            }`}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertMarkdown('1. ', '')}
            className={`p-2 rounded transition-colors ${
              darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'
            }`}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <div className={`w-px h-5 mx-1 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
          <button
            onClick={() => insertMarkdown('| Header 1 | Header 2 | Header 3 |\n| --- | --- | --- |\n| Cell 1 | Cell 2 | Cell 3 |', '')}
            className={`p-2 rounded transition-colors ${
              darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'
            }`}
            title="Table"
          >
            <Table className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertMarkdown('## ', '')}
            className={`p-2 rounded transition-colors ${
              darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'
            }`}
            title="Heading"
          >
            <Heading className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertMarkdown('# ', '')}
            className={`p-2 rounded transition-colors ${
              darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'
            }`}
            title="Heading 1"
          >
            <Hash className="w-4 h-4" />
          </button>
          <div className="flex-1" />
          <span className={`text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            Markdown supported
          </span>
        </div>

        {/* Editor + Preview */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor */}
          <div className="flex-1 flex flex-col">
            <textarea
              ref={editorRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className={`flex-1 p-6 resize-none font-mono text-sm focus:outline-none ${
                darkMode
                  ? 'bg-gray-900 text-gray-300'
                  : 'bg-white text-gray-800'
              }`}
              placeholder="Write your content here using Markdown..."
            />
          </div>

          {/* Preview */}
          <div className={`flex-1 border-l overflow-y-auto ${
            darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
          }`}>
            <div
              ref={previewRef}
              className={`p-6 prose max-w-none ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(editContent, darkMode) }}
            />
          </div>
        </div>
      </div>
    );
  }

  // View mode
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className={`text-3xl font-bold mb-3 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {page.title}
            </h1>
            <div className={`flex items-center gap-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {page.createdByName && (
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                    darkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {page.createdByName.charAt(0).toUpperCase()}
                  </div>
                  <span>{page.createdByName}</span>
                </div>
              )}
              <span>
                {new Date(page.updatedAt || page.createdAt).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={onStartEdit}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  darkMode
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Edit
              </button>
            )}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className={`absolute right-0 top-full mt-1 w-48 rounded-lg shadow-lg border z-20 py-1 ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <button
                      onClick={() => {
                        window.print();
                        setShowMenu(false);
                      }}
                      className={`w-full flex items-center px-3 py-2 text-sm ${
                        darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Print
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        setShowMenu(false);
                      }}
                      className={`w-full flex items-center px-3 py-2 text-sm ${
                        darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      Copy link
                    </button>
                    <button
                      onClick={() => setShowMenu(false)}
                      className={`w-full flex items-center px-3 py-2 text-sm ${
                        darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <History className="w-4 h-4 mr-2" />
                      View revisions
                    </button>
                    {isAdmin && (
                      <>
                        <div className={`my-1 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                        <button
                          onClick={() => {
                            onDeletePage(page);
                            setShowMenu(false);
                          }}
                          className={`w-full flex items-center px-3 py-2 text-sm ${
                            darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className={`border-t mb-6 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />

        {/* Page Content */}
        <div
          className={`prose max-w-none mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(page.content || '', darkMode) }}
        />

        {/* Visit Stats */}
        <div className={`flex items-center gap-2 text-sm mb-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          <Eye className="w-4 h-4" />
          <span>Last updated {new Date(page.updatedAt || page.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Divider */}
        <div className={`border-t mb-6 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />

        {/* Comments Section */}
        <div>
          <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            Comments
          </h2>

          {/* Existing Comments */}
          {(page.comments || []).length > 0 && (
            <div className="space-y-4 mb-6">
              {(page.comments || []).map((comment) => (
                <div
                  key={comment.id}
                  className={`flex gap-3 p-4 rounded-lg ${
                    darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium ${
                    darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {comment.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                          {comment.authorName}
                        </span>
                        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {new Date(comment.createdAt).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => onDeleteComment(comment.id)}
                          className={`p-1 rounded transition-colors ${
                            darkMode
                              ? 'text-gray-500 hover:text-red-400 hover:bg-gray-700'
                              : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Comment */}
          {isAdmin && (
            <div className="flex gap-3">
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium ${
                darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'
              }`}>
                {user?.email?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className={`w-full px-4 py-3 rounded-lg border text-sm resize-none ${
                    darkMode
                      ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {commentText.trim() && (
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => {
                        onAddComment(commentText);
                        setCommentText('');
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      Comment
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
