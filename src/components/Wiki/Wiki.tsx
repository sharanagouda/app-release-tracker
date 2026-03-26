import React, { useState, useEffect } from 'react';
import { WikiPage } from '../../types/wiki';
import {
  getWikiPages,
  addWikiPage,
  updateWikiPage,
  deleteWikiPage,
  addWikiComment,
  deleteWikiComment,
  moveWikiPage,
  buildWikiTree,
} from '../../services/firebaseWiki';
import { WikiSidebar } from './WikiSidebar';
import { WikiContent } from './WikiContent';
import { Menu, X } from 'lucide-react';

interface WikiProps {
  isAdmin: boolean;
  onAuthRequired: (action: string) => void;
  darkMode: boolean;
  user: any;
}

export const Wiki: React.FC<WikiProps> = ({
  isAdmin,
  onAuthRequired,
  darkMode,
  user,
}) => {
  const [allPages, setAllPages] = useState<WikiPage[]>([]);
  const [treePages, setTreePages] = useState<WikiPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<WikiPage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const pages = await getWikiPages();
      setAllPages(pages);
      const tree = buildWikiTree(pages);
      setTreePages(tree);

      // If we had a selected page, refresh it
      if (selectedPage) {
        const updated = pages.find((p) => p.id === selectedPage.id);
        if (updated) {
          setSelectedPage(updated);
        }
      }
    } catch (error) {
      console.error('Error fetching wiki pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTree = (pages: WikiPage[], term: string): WikiPage[] => {
    if (!term) return pages;
    const lower = term.toLowerCase();

    const filterNode = (page: WikiPage): WikiPage | null => {
      const titleMatch = page.title.toLowerCase().includes(lower);
      const filteredChildren = (page.children || [])
        .map(filterNode)
        .filter(Boolean) as WikiPage[];

      if (titleMatch || filteredChildren.length > 0) {
        return { ...page, children: filteredChildren };
      }
      return null;
    };

    return pages.map(filterNode).filter(Boolean) as WikiPage[];
  };

  const displayedPages = filterTree(treePages, searchTerm);

  const handleSelectPage = (page: WikiPage) => {
    // Get the full page data from allPages (which has comments etc.)
    const fullPage = allPages.find((p) => p.id === page.id) || page;
    setSelectedPage(fullPage);
    setIsEditing(false);
    setShowMobileSidebar(false);
  };

  const handleAddPage = async (parentId: string | null) => {
    if (!isAdmin) {
      onAuthRequired('create a new wiki page');
      return;
    }

    try {
      const newPageId = await addWikiPage({
        title: 'New Page',
        content: '',
        parentId,
        order: allPages.length,
      });
      await fetchPages();

      // Select the new page and start editing
      const pages = await getWikiPages();
      const newPage = pages.find((p) => p.id === newPageId);
      if (newPage) {
        setSelectedPage(newPage);
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error adding wiki page:', error);
    }
  };

  const handleAddSubPage = async (parentId: string) => {
    if (!isAdmin) {
      onAuthRequired('create a sub-page');
      return;
    }
    await handleAddPage(parentId);
  };

  const handleDeletePage = async (page: WikiPage) => {
    if (!isAdmin) {
      onAuthRequired('delete this wiki page');
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${page.title}"? This will also delete all sub-pages.`)) {
      try {
        await deleteWikiPage(page.id);
        if (selectedPage?.id === page.id) {
          setSelectedPage(null);
          setIsEditing(false);
        }
        await fetchPages();
      } catch (error) {
        console.error('Error deleting wiki page:', error);
      }
    }
  };

  const handleRenamePage = (page: WikiPage) => {
    if (!isAdmin) {
      onAuthRequired('edit this wiki page');
      return;
    }
    setSelectedPage(page);
    setIsEditing(true);
  };

  const handleMovePage = async (page: WikiPage) => {
    if (!isAdmin) {
      onAuthRequired('move this wiki page');
      return;
    }

    // Simple move: prompt for new parent
    const parentTitle = prompt(
      'Enter the title of the new parent page (leave empty for root):',
      ''
    );

    if (parentTitle === null) return; // Cancelled

    let newParentId: string | null = null;
    if (parentTitle.trim()) {
      const parent = allPages.find(
        (p) => p.title.toLowerCase() === parentTitle.trim().toLowerCase()
      );
      if (!parent) {
        alert('Parent page not found');
        return;
      }
      if (parent.id === page.id) {
        alert('Cannot move a page under itself');
        return;
      }
      newParentId = parent.id;
    }

    try {
      await moveWikiPage(page.id, newParentId);
      await fetchPages();
    } catch (error) {
      console.error('Error moving wiki page:', error);
    }
  };

  const handleCopyPath = (page: WikiPage) => {
    // Build the path from root to this page
    const buildPath = (pageId: string): string[] => {
      const p = allPages.find((pg) => pg.id === pageId);
      if (!p) return [];
      if (p.parentId) {
        return [...buildPath(p.parentId), p.title];
      }
      return [p.title];
    };

    const path = buildPath(page.id).join(' / ');
    navigator.clipboard.writeText(path);
    alert(`Path copied: ${path}`);
  };

  const handleStartEdit = () => {
    if (!isAdmin) {
      onAuthRequired('edit this wiki page');
      return;
    }
    setIsEditing(true);
  };

  const handleSaveEdit = async (title: string, content: string) => {
    if (!selectedPage) return;

    try {
      await updateWikiPage(selectedPage.id, { title, content });
      setIsEditing(false);
      await fetchPages();
    } catch (error) {
      console.error('Error saving wiki page:', error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleAddComment = async (content: string) => {
    if (!selectedPage) return;
    if (!isAdmin) {
      onAuthRequired('add a comment');
      return;
    }

    try {
      await addWikiComment(selectedPage.id, content);
      await fetchPages();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedPage) return;
    if (!isAdmin) {
      onAuthRequired('delete this comment');
      return;
    }

    try {
      await deleteWikiComment(selectedPage.id, commentId);
      await fetchPages();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
          darkMode ? 'border-blue-400' : 'border-blue-600'
        }`} />
      </div>
    );
  }

  return (
    <div className={`flex h-[calc(100vh-8rem)] rounded-lg overflow-hidden border ${
      darkMode ? 'border-gray-700' : 'border-gray-200'
    }`}>
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setShowMobileSidebar(!showMobileSidebar)}
        className={`lg:hidden fixed bottom-4 left-4 z-30 p-3 rounded-full shadow-lg ${
          darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
        }`}
      >
        {showMobileSidebar ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <WikiSidebar
          pages={displayedPages}
          selectedPageId={selectedPage?.id || null}
          onSelectPage={handleSelectPage}
          onAddPage={handleAddPage}
          onAddSubPage={handleAddSubPage}
          onDeletePage={handleDeletePage}
          onRenamePage={handleRenamePage}
          onMovePage={handleMovePage}
          onCopyPath={handleCopyPath}
          isAdmin={isAdmin}
          darkMode={darkMode}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </div>

      {/* Sidebar - Mobile */}
      {showMobileSidebar && (
        <div className="lg:hidden fixed inset-0 z-20">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileSidebar(false)} />
          <div className="relative h-full w-72">
            <WikiSidebar
              pages={displayedPages}
              selectedPageId={selectedPage?.id || null}
              onSelectPage={handleSelectPage}
              onAddPage={handleAddPage}
              onAddSubPage={handleAddSubPage}
              onDeletePage={handleDeletePage}
              onRenamePage={handleRenamePage}
              onMovePage={handleMovePage}
              onCopyPath={handleCopyPath}
              isAdmin={isAdmin}
              darkMode={darkMode}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <WikiContent
        page={selectedPage}
        isEditing={isEditing}
        onStartEdit={handleStartEdit}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
        onDeletePage={handleDeletePage}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
        isAdmin={isAdmin}
        darkMode={darkMode}
        user={user}
      />
    </div>
  );
};
