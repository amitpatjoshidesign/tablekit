import { getPageItems, getPageRange } from "@tablekit/core";
import { useId } from "react";
import { useTableContext } from "./context";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

export function Pagination({
  pageSizeOptions = [10, 25, 50, 100],
}: {
  pageSizeOptions?: number[];
}) {
  const { table, labels, announce, layout } = useTableContext();
  const id = useId();
  if (table.options.enablePagination === false) return null;

  const { pageCount, totalRows } = table.rowModel;
  const pageSize = table.state.pagination.pageSize;
  const pageIndex = Math.min(table.state.pagination.pageIndex, pageCount - 1);
  const { from, to, total } = getPageRange({ pageIndex, pageSize }, totalRows);
  const items = getPageItems(pageIndex, pageCount, layout === "stack" ? 0 : 1);
  const sizes = pageSizeOptions.includes(pageSize)
    ? pageSizeOptions
    : [...pageSizeOptions, pageSize].sort((a, b) => a - b);

  const go = (i: number) => {
    table.setPageIndex(i);
    announce(labels.pageOf(i + 1, pageCount));
  };

  return (
    <div className="tk-pagination">
      <div className="tk-page-size">
        <label htmlFor={id}>{labels.rowsPerPage}</label>
        <select
          id={id}
          className="tk-input tk-select"
          value={pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
        >
          {sizes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <p className="tk-page-range">{labels.range(from, to, total)}</p>
      <nav className="tk-pages" aria-label={labels.pagination}>
        <button
          type="button"
          className="tk-icon-button"
          aria-label={labels.previousPage}
          disabled={pageIndex === 0}
          onClick={() => go(pageIndex - 1)}
        >
          <ChevronLeftIcon />
        </button>
        <ol className="tk-page-list">
          {items.map((item, i) =>
            item === "…" ? (
              // biome-ignore lint/suspicious/noArrayIndexKey: ellipses have no identity
              <li key={`e${i}`} className="tk-page-ellipsis" aria-hidden="true">
                …
              </li>
            ) : (
              <li key={item}>
                <button
                  type="button"
                  className="tk-page"
                  aria-label={labels.page(item)}
                  aria-current={item === pageIndex + 1 ? "page" : undefined}
                  onClick={() => go(item - 1)}
                >
                  {item}
                </button>
              </li>
            ),
          )}
        </ol>
        <button
          type="button"
          className="tk-icon-button"
          aria-label={labels.nextPage}
          disabled={pageIndex >= pageCount - 1}
          onClick={() => go(pageIndex + 1)}
        >
          <ChevronRightIcon />
        </button>
      </nav>
    </div>
  );
}
