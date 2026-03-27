import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { UsePaginationReturn } from '../hooks/usePagination';

interface PaginationProps extends Omit<UsePaginationReturn<unknown>, 'paginatedItems'> {
  darkMode?: boolean;
  pageSizeOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  startIndex,
  endIndex,
  hasPrevPage,
  hasNextPage,
  goToPage,
  goToNextPage,
  goToPrevPage,
  goToFirstPage,
  goToLastPage,
  setPageSize,
  darkMode = false,
  pageSizeOptions = [10, 25, 50, 100],
}) => {
  if (totalItems === 0) return null;

  // Generate page numbers to show (max 5 visible)
  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | '...')[] = [1];

    if (currentPage > 3) pages.push('...');

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);

    return pages;
  };

  const btnBase = `inline-flex items-center justify-center w-8 h-8 rounded text-sm font-medium transition-colors`;
  const btnActive = darkMode
    ? 'bg-blue-600 text-white'
    : 'bg-blue-600 text-white';
  const btnInactive = darkMode
    ? 'text-gray-300 hover:bg-gray-700'
    : 'text-gray-700 hover:bg-gray-100';
  const btnDisabled = darkMode
    ? 'text-gray-600 cursor-not-allowed'
    : 'text-gray-300 cursor-not-allowed';

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t ${
      darkMode ? 'border-gray-700' : 'border-gray-200'
    }`}>
      {/* Left: showing X–Y of Z */}
      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Showing{' '}
        <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
          {totalItems === 0 ? 0 : startIndex + 1}
        </span>
        {' '}–{' '}
        <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
          {endIndex}
        </span>
        {' '}of{' '}
        <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
          {totalItems}
        </span>
        {' '}releases
      </div>

      {/* Center: page buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={goToFirstPage}
          disabled={!hasPrevPage}
          className={`${btnBase} ${hasPrevPage ? btnInactive : btnDisabled}`}
          title="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          onClick={goToPrevPage}
          disabled={!hasPrevPage}
          className={`${btnBase} ${hasPrevPage ? btnInactive : btnDisabled}`}
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((page, idx) =>
          page === '...' ? (
            <span
              key={`ellipsis-${idx}`}
              className={`w-8 text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
            >
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => goToPage(page as number)}
              className={`${btnBase} ${page === currentPage ? btnActive : btnInactive}`}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={goToNextPage}
          disabled={!hasNextPage}
          className={`${btnBase} ${hasNextPage ? btnInactive : btnDisabled}`}
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={goToLastPage}
          disabled={!hasNextPage}
          className={`${btnBase} ${hasNextPage ? btnInactive : btnDisabled}`}
          title="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

      {/* Right: page size selector */}
      <div className="flex items-center gap-2">
        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Rows per page:
        </span>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className={`px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            darkMode
              ? 'bg-gray-700 border-gray-600 text-gray-100'
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
