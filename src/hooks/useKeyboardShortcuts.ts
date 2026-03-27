import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  /** Also matches Cmd (metaKey) on Mac */
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
  action: () => void;
  /** If true, the shortcut fires even when an input/textarea is focused */
  allowInInput?: boolean;
}

/**
 * Registers global keyboard shortcuts.
 * Shortcuts are ignored when the user is typing in an input/textarea/select
 * unless `allowInInput` is set to true.
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      for (const shortcut of shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        // ctrlKey also accepts metaKey (Cmd on Mac) as an equivalent
        const ctrlMatch = shortcut.ctrlKey ? e.ctrlKey || e.metaKey : true;
        const shiftMatch = shortcut.shiftKey ? e.shiftKey : true;
        const altMatch = shortcut.altKey ? e.altKey : true;

        // For simple single-key shortcuts (no modifier), skip when typing
        const hasModifier = shortcut.ctrlKey || shortcut.shiftKey || shortcut.altKey;
        if (isTyping && !hasModifier && !shortcut.allowInInput) continue;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
