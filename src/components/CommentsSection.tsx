/**
 * CommentsSection
 *
 * A self-contained comments thread for a release.
 * Uses real-time Firestore listener for live updates.
 * Supports add, edit, and delete (own comments only).
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, Edit3, Trash2, X, Check, MessageCircle, User } from 'lucide-react';
import { ReleaseComment } from '../types/release';
import {
  subscribeToComments,
  addComment,
  updateComment,
  deleteComment,
} from '../services/firebaseComments';

interface CommentsSectionProps {
  releaseId: string;
  releaseName: string;
  darkMode?: boolean;
  currentUserEmail?: string;
  /** Optional callback to request elevated permission (e.g., open PermissionDeniedModal) */
  onRequestPermission?: (action: string) => void;
}

const getRelativeTime = (isoString: string): string => {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

const getInitials = (name: string): string => {
  return name
    .split(/[\s._-]+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Deterministic color from a string
const getAvatarColor = (str: string): string => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  releaseId,
  releaseName,
  darkMode = false,
  currentUserEmail,
  onRequestPermission,
}) => {
  const [comments, setComments] = useState<ReleaseComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Subscribe to real-time comments
  useEffect(() => {
    if (!releaseId) return;

    setLoading(true);
    const unsubscribe = subscribeToComments(
      releaseId,
      (liveComments) => {
        setComments(liveComments);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading comments:', err);
        setError('Failed to load comments');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [releaseId]);

  // No auto-scroll — let the user scroll to the discussion section manually

  const handleSend = async () => {
    const trimmed = newComment.trim();
    if (!trimmed || sending) return;

    if (!currentUserEmail) {
      setError('You must be signed in to comment');
      return;
    }

    setSending(true);
    setError(null);
    try {
      await addComment(releaseId, releaseName, trimmed);
      setNewComment('');
      textareaRef.current?.focus();
    } catch (err) {
      setError('Failed to post comment');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter to send
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const EDIT_DELETE_WINDOW_MINUTES = 10;

  const minutesSince = (isoString: string) => {
    const commentTime = new Date(isoString).getTime();
    const now = Date.now();
    return (now - commentTime) / 60000;
  };

  // Only the comment author can edit or delete their own comment within the time window
  const canModify = (comment: ReleaseComment) => {
    if (!currentUserEmail) return false;
    if (comment.userEmail !== currentUserEmail) return false;
    return minutesSince(comment.createdAt) <= EDIT_DELETE_WINDOW_MINUTES;
  };

  const handleStartEdit = (comment: ReleaseComment) => {
    if (!currentUserEmail) {
      onRequestPermission?.('edit comments');
      return;
    }

    if (!canModify(comment)) {
      // If the user is signed in but not allowed, direct them to request access instead of sign-in
      onRequestPermission?.('edit comments');
      return;
    }

    setEditingId(comment.id);
    setEditText(comment.text);
  };

  const handleModifyAttempt = (comment: ReleaseComment, action: 'edit' | 'delete') => {
    if (!currentUserEmail) {
      onRequestPermission?.(`${action} comments`);
      return;
    }

    // Only show the request-access path for the comment author; others simply can't modify.
    if (comment.userEmail !== currentUserEmail) return;

    if (minutesSince(comment.createdAt) > EDIT_DELETE_WINDOW_MINUTES) {
      alert(`You can only ${action} comments within ${EDIT_DELETE_WINDOW_MINUTES} minutes of posting.`);
      return;
    }

    // Fallback: if for some other reason we can't modify, route to permission request
    onRequestPermission?.(`${action} comments`);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editText.trim()) return;

    const comment = comments.find((c) => c.id === editingId);
    if (!comment) return;

    if (!currentUserEmail) {
      onRequestPermission?.('edit comments');
      return;
    }

    if (!canModify(comment)) {
      onRequestPermission?.('edit comments');
      return;
    }

    try {
      await updateComment(editingId, editText.trim());
      setEditingId(null);
      setEditText('');
    } catch (err) {
      console.error('Failed to update comment:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleDelete = async (comment: ReleaseComment) => {
    if (!currentUserEmail) {
      onRequestPermission?.('delete comments');
      return;
    }

    if (!canModify(comment)) {
      onRequestPermission?.('delete comments');
      return;
    }

    if (!confirm('Delete this comment?')) return;
    try {
      await deleteComment(comment.id, releaseId, releaseName, comment.text);
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  return (
    <div className={`rounded-lg border ${
      darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
    }`}>
      {/* Header */}
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${
        darkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <MessageCircle className={`w-4 h-4 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
        <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          Discussion ({comments.length})
        </h3>
      </div>

      {/* Comments list */}
      <div className="max-h-80 overflow-y-auto px-4 py-3 space-y-3">
        {loading && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className={`w-8 h-8 rounded-full flex-shrink-0 ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-300'
                }`} />
                <div className="flex-1 space-y-2">
                  <div className={`h-3 w-24 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
                  <div className={`h-3 w-full rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && comments.length === 0 && (
          <div className="text-center py-6">
            <MessageCircle className={`w-8 h-8 mx-auto mb-2 ${
              darkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              No comments yet. Start the discussion!
            </p>
          </div>
        )}

        {!loading && comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 group">
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${
              getAvatarColor(comment.userEmail)
            }`}>
              {getInitials(comment.userName)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm font-medium ${
                  darkMode ? 'text-gray-200' : 'text-gray-900'
                }`}>
                  {comment.userName}
                </span>
                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {getRelativeTime(comment.createdAt)}
                </span>
                {comment.edited && (
                  <span className={`text-xs italic ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    (edited)
                  </span>
                )}
              </div>

              {editingId === comment.id ? (
                <div className="mt-1 space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    rows={2}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <Check className="w-3 h-3" /> Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
                        darkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className={`text-sm mt-0.5 whitespace-pre-wrap break-words ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {comment.text}
                </p>
              )}

              {/* Actions — visible on hover or for own comments */}
              {comment.userEmail === currentUserEmail && editingId !== comment.id && (
                <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      if (canModify(comment)) {
                        handleStartEdit(comment);
                      } else {
                        handleModifyAttempt(comment, 'edit');
                      }
                    }}
                    className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${
                      darkMode
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                    } ${!canModify(comment) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={!canModify(comment) ? "Can only edit within 10 minutes" : "Edit comment"}
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => {
                      if (canModify(comment)) {
                        handleDelete(comment);
                      } else {
                        handleModifyAttempt(comment, 'delete');
                      }
                    }}
                    className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${
                      darkMode
                        ? 'text-red-400 hover:text-red-300 hover:bg-red-900/30'
                        : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                    } ${!canModify(comment) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={!canModify(comment) ? "Can only delete within 10 minutes" : "Delete comment"}
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className={`mx-4 mb-2 px-3 py-2 text-xs rounded-lg ${
          darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'
        }`}>
          {error}
        </div>
      )}

      {/* Input area */}
      {currentUserEmail ? (
        <div className={`px-4 py-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a comment... (Ctrl+Enter to send)"
              rows={2}
              className={`flex-1 px-3 py-2 text-sm border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
            <button
              onClick={handleSend}
              disabled={!newComment.trim() || sending}
              className={`self-end px-3 py-2 rounded-lg transition-colors ${
                newComment.trim() && !sending
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : darkMode
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              title="Send comment"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Press Ctrl+Enter to send
          </p>
        </div>
      ) : (
        <div className={`px-4 py-3 border-t text-center ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <User className="w-4 h-4 inline mr-1" />
            Sign in to join the discussion
          </p>
        </div>
      )}
    </div>
  );
};
