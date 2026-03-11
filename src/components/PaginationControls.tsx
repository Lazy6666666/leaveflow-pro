import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
}

const PaginationControls = ({ page, totalPages, onPageChange, totalItems }: Props) => {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-between pt-4" aria-label="Pagination">
      <p className="text-xs text-muted-foreground">{totalItems} total items</p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label={`Go to page ${page - 1}`}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <span className="text-xs text-muted-foreground px-2 tabular-nums" aria-live="polite" aria-atomic="true">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label={`Go to page ${page + 1}`}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
};

export default PaginationControls;
