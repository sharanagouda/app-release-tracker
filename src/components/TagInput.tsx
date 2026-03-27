import React, { useState, useRef, KeyboardEvent } from 'react';
import { X, Tag } from 'lucide-react';

// Predefined tag suggestions with colors
export const PREDEFINED_TAGS = [
  'hotfix',
  'critical',
  'feature',
  'bugfix',
  'security',
  'performance',
  'ui',
  'backend',
  'breaking-change',
  'minor',
  'major',
  'patch',
  'experimental',
  'deprecated',
];

export const TAG_COLORS: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  hotfix:          { bg: 'bg-red-100',    text: 'text-red-700',    darkBg: 'bg-red-900/40',    darkText: 'text-red-300' },
  critical:        { bg: 'bg-red-100',    text: 'text-red-800',    darkBg: 'bg-red-900/50',    darkText: 'text-red-200' },
  feature:         { bg: 'bg-blue-100',   text: 'text-blue-700',   darkBg: 'bg-blue-900/40',   darkText: 'text-blue-300' },
  bugfix:          { bg: 'bg-orange-100', text: 'text-orange-700', darkBg: 'bg-orange-900/40', darkText: 'text-orange-300' },
  security:        { bg: 'bg-purple-100', text: 'text-purple-700', darkBg: 'bg-purple-900/40', darkText: 'text-purple-300' },
  performance:     { bg: 'bg-cyan-100',   text: 'text-cyan-700',   darkBg: 'bg-cyan-900/40',   darkText: 'text-cyan-300' },
  ui:              { bg: 'bg-pink-100',   text: 'text-pink-700',   darkBg: 'bg-pink-900/40',   darkText: 'text-pink-300' },
  backend:         { bg: 'bg-indigo-100', text: 'text-indigo-700', darkBg: 'bg-indigo-900/40', darkText: 'text-indigo-300' },
  'breaking-change': { bg: 'bg-red-200', text: 'text-red-900',    darkBg: 'bg-red-900/60',    darkText: 'text-red-200' },
  minor:           { bg: 'bg-green-100',  text: 'text-green-700',  darkBg: 'bg-green-900/40',  darkText: 'text-green-300' },
  major:           { bg: 'bg-yellow-100', text: 'text-yellow-800', darkBg: 'bg-yellow-900/40', darkText: 'text-yellow-300' },
  patch:           { bg: 'bg-gray-100',   text: 'text-gray-700',   darkBg: 'bg-gray-700/50',   darkText: 'text-gray-300' },
  experimental:    { bg: 'bg-violet-100', text: 'text-violet-700', darkBg: 'bg-violet-900/40', darkText: 'text-violet-300' },
  deprecated:      { bg: 'bg-gray-200',   text: 'text-gray-600',   darkBg: 'bg-gray-700/70',   darkText: 'text-gray-400' },
};

const DEFAULT_COLOR = { bg: 'bg-blue-100', text: 'text-blue-700', darkBg: 'bg-blue-900/40', darkText: 'text-blue-300' };

export const getTagColor = (tag: string, darkMode = false) => {
  const colors = TAG_COLORS[tag.toLowerCase()] || DEFAULT_COLOR;
  return darkMode
    ? `${colors.darkBg} ${colors.darkText}`
    : `${colors.bg} ${colors.text}`;
};

interface TagBadgeProps {
  tag: string;
  darkMode?: boolean;
  onRemove?: () => void;
  size?: 'sm' | 'xs';
}

export const TagBadge: React.FC<TagBadgeProps> = ({
  tag,
  darkMode = false,
  onRemove,
  size = 'sm',
}) => {
  const sizeClasses = size === 'xs' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses} ${getTagColor(tag, darkMode)}`}
    >
      {tag}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="hover:opacity-70 transition-opacity"
          aria-label={`Remove tag ${tag}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  darkMode?: boolean;
  placeholder?: string;
  maxTags?: number;
}

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  onChange,
  darkMode = false,
  placeholder = 'Add tag (e.g. hotfix, feature)...',
  maxTags = 10,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = PREDEFINED_TAGS.filter(
    (t) =>
      t.toLowerCase().includes(inputValue.toLowerCase()) &&
      !tags.includes(t)
  );

  const addTag = (tag: string) => {
    const normalized = tag.trim().toLowerCase().replace(/\s+/g, '-');
    if (!normalized || tags.includes(normalized) || tags.length >= maxTags) return;
    onChange([...tags, normalized]);
    setInputValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <div
        className={`flex flex-wrap gap-1.5 items-center min-h-[42px] px-3 py-2 border rounded-lg cursor-text ${
          darkMode
            ? 'bg-gray-700 border-gray-600 text-gray-100'
            : 'bg-white border-gray-300 text-gray-900'
        } focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent`}
        onClick={() => inputRef.current?.focus()}
      >
        <Tag className={`w-3.5 h-3.5 flex-shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
        {tags.map((tag) => (
          <TagBadge
            key={tag}
            tag={tag}
            darkMode={darkMode}
            onRemove={() => removeTag(tag)}
          />
        ))}
        {tags.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder={tags.length === 0 ? placeholder : ''}
            className={`flex-1 min-w-[120px] outline-none bg-transparent text-sm ${
              darkMode ? 'placeholder-gray-500' : 'placeholder-gray-400'
            }`}
          />
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          className={`absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border shadow-lg overflow-hidden ${
            darkMode
              ? 'bg-gray-800 border-gray-600'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="max-h-40 overflow-y-auto">
            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(suggestion);
                }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                  darkMode
                    ? 'hover:bg-gray-700 text-gray-200'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <TagBadge tag={suggestion} darkMode={darkMode} size="xs" />
              </button>
            ))}
          </div>
          <div className={`px-3 py-1.5 text-xs border-t ${
            darkMode ? 'text-gray-500 border-gray-700' : 'text-gray-400 border-gray-100'
          }`}>
            Press Enter or comma to add custom tag
          </div>
        </div>
      )}

      {tags.length >= maxTags && (
        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Maximum {maxTags} tags reached
        </p>
      )}
    </div>
  );
};
