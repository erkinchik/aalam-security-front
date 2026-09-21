/**
 * Переключатель страниц. Раньше такая разметка жила только внутри списка
 * тревог; с появлением пагинации у операторов и организаций её вынесли, чтобы
 * три списка не разъезжались по виду и поведению.
 */
export function Pagination({
  page,
  total,
  limit,
  onPageChange,
}: {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-md border border-[var(--color-border)] px-3 py-1 text-sm disabled:opacity-50"
      >
        Назад
      </button>
      <span className="flex items-center px-3 text-sm text-[var(--color-muted)]">
        Страница {page} из {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-md border border-[var(--color-border)] px-3 py-1 text-sm disabled:opacity-50"
      >
        Вперёд
      </button>
    </div>
  );
}
