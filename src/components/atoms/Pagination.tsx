import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "./Button";

/**
 * Pagination component props interface
 */
export interface PaginationProps {
  /** Current page number (1-based) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of items */
  totalItems: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when page size changes */
  onPageSizeChange?: (pageSize: number) => void;
  /** Available page sizes */
  pageSizeOptions?: number[];
  /** Whether to show page size selector */
  showPageSizeSelector?: boolean;
}

/**
 * Pagination component for navigating through paginated data
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showPageSizeSelector = true,
}) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Page size selector */}
      {showPageSizeSelector && onPageSizeChange && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>per page</span>
        </div>
      )}

      {/* Items info */}
      <div className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {totalItems} results
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getVisiblePages().map((page, index) => (
          <React.Fragment key={index}>
            {page === "..." ? (
              <Button
                variant="outline"
                size="sm"
                disabled
                className="h-8 w-8 p-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page as number)}
                className="h-8 w-8 p-0"
              >
                {page}
              </Button>
            )}
          </React.Fragment>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
