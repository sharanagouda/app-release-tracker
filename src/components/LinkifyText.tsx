import React from 'react';

interface LinkifyTextProps {
  text: string;
  className?: string;
  darkMode?: boolean;
}

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export const LinkifyText: React.FC<LinkifyTextProps> = ({ text, className = '', darkMode = false }) => {
  const parts = text.split(URL_REGEX);
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (URL_REGEX.test(part)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className={`underline hover:no-underline ${
                darkMode 
                  ? 'text-blue-400 hover:text-blue-300' 
                  : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              {part}
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};