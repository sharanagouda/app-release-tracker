import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, Plus, MoreVertical, FolderPlus, Copy, Move, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { WikiPage } from '../../types/wiki';

interface WikiSidebarProps {
  pages: WikiPage[];
  selectedPageId: string | null;
  onSelectPage: (page: WikiPage) => void;
  onAddPage: (parentId: string | null) => void;
  onAddSubPage: (parentId: string) => void;
  onDeletePage: (page: WikiPage) => void;
  onRenamePage: (page: WikiPage) => void;
  onMovePage: (page: WikiPage) => void;
  onCopyPath: (page: WikiPage) => void;
  isAdmin: boolean;
  darkMode: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

interface TreeNodeProps {
  page: WikiPage;
  depth: number;
  selectedPageId: string | null;
  onSelectPage: (page: WikiPage) => void;
  onAddSubPage: (parentId: string) => void;
  onDeletePage: (page: WikiPage) => void;
  onRenamePage: (page: WikiPage) => void;
  onMovePage: (page: WikiPage) => void;
  onCopyPath: (page: WikiPage) => void;
  isAdmin: boolean;
  darkMode: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  page,
  depth,
  selectedPageId,
  onSelectPage,
  onAddSubPage,
  onDeletePage,
  onRenamePage,
  onMovePage,
  onCopyPath,
  isAdmin,
  darkMode,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const hasChildren = page.children && page.children.length > 0;
  const isSelected = selectedPageId === page.id;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowContextMenu(!showContextMenu);
  };

  return (
    <div>
      <div
        className={`group flex items-center py-1.5 px-2 cursor-pointer rounded-md transition-colors relative ${
          isSelected
            ? darkMode
              ? 'bg-blue-900/40 text-blue-300'
              : 'bg-blue-50 text-blue-700'
            : darkMode
              ? 'text-gray-300 hover:bg-gray-700/50'
              : 'text-gray-700 hover:bg-gray-100'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelectPage(page)}
      >
        {/* Expand/Collapse toggle */}
        <button
          onClick={handleToggle}
          className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${
            hasChildren ? 'visible' : 'invisible'
          } ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Page icon */}
        <FileText className={`w-4 h-4 flex-shrink-0 mx-1.5 ${
          darkMode ? 'text-gray-400' : 'text-gray-500'
        }`} />

        {/* Page title */}
        <span className="text-sm truncate flex-1">{page.title}</span>

        {/* Context menu button */}
        {isAdmin && (
          <div className="relative">
            <button
              onClick={handleContextMenu}
              className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${
                darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
              }`}
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {showContextMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowContextMenu(false);
                  }}
                />
                <div
                  className={`absolute right-0 top-full mt-1 w-48 rounded-lg shadow-lg border z-20 py-1 ${
                    darkMode
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddSubPage(page.id);
                      setShowContextMenu(false);
                    }}
                    className={`w-full flex items-center px-3 py-2 text-sm ${
                      darkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FolderPlus className="w-4 h-4 mr-2" />
                    Add sub-page
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyPath(page);
                      setShowContextMenu(false);
                    }}
                    className={`w-full flex items-center px-3 py-2 text-sm ${
                      darkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy page path
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMovePage(page);
                      setShowContextMenu(false);
                    }}
                    className={`w-full flex items-center px-3 py-2 text-sm ${
                      darkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Move className="w-4 h-4 mr-2" />
                    Move page
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRenamePage(page);
                      setShowContextMenu(false);
                    }}
                    className={`w-full flex items-center px-3 py-2 text-sm ${
                      darkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </button>
                  <div className={`my-1 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePage(page);
                      setShowContextMenu(false);
                    }}
                    className={`w-full flex items-center px-3 py-2 text-sm ${
                      darkMode
                        ? 'text-red-400 hover:bg-gray-700'
                        : 'text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {page.children!.map((child) => (
            <TreeNode
              key={child.id}
              page={child}
              depth={depth + 1}
              selectedPageId={selectedPageId}
              onSelectPage={onSelectPage}
              onAddSubPage={onAddSubPage}
              onDeletePage={onDeletePage}
              onRenamePage={onRenamePage}
              onMovePage={onMovePage}
              onCopyPath={onCopyPath}
              isAdmin={isAdmin}
              darkMode={darkMode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const WikiSidebar: React.FC<WikiSidebarProps> = ({
  pages,
  selectedPageId,
  onSelectPage,
  onAddPage,
  onAddSubPage,
  onDeletePage,
  onRenamePage,
  onMovePage,
  onCopyPath,
  isAdmin,
  darkMode,
  searchTerm,
  onSearchChange,
}) => {
  return (
    <div
      className={`w-72 flex-shrink-0 border-r flex flex-col h-full ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      {/* Search */}
      <div className={`p-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <input
          type="text"
          placeholder="Enter page title"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`w-full px-3 py-2 text-sm rounded-md border ${
            darkMode
              ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
              : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
      </div>

      {/* Page Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {pages.length === 0 ? (
          <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <FileText className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No pages yet</p>
          </div>
        ) : (
          pages.map((page) => (
            <TreeNode
              key={page.id}
              page={page}
              depth={0}
              selectedPageId={selectedPageId}
              onSelectPage={onSelectPage}
              onAddSubPage={onAddSubPage}
              onDeletePage={onDeletePage}
              onRenamePage={onRenamePage}
              onMovePage={onMovePage}
              onCopyPath={onCopyPath}
              isAdmin={isAdmin}
              darkMode={darkMode}
            />
          ))
        )}
      </div>

      {/* New Page Button */}
      {isAdmin && (
        <div className={`p-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={() => onAddPage(null)}
            className={`w-full flex items-center justify-center px-3 py-2 text-sm rounded-md transition-colors ${
              darkMode
                ? 'text-gray-300 hover:bg-gray-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Plus className="w-4 h-4 mr-2" />
            New page
          </button>
        </div>
      )}
    </div>
  );
};
