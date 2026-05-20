import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getOrganizationApplications } from "../../api/admin";
import { Badge } from "../../components/ui/Badge";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import type { OrganizationApplicationListItem, OrganizationApplicationStatus } from "../../types/api";

const STATUS_OPTIONS: { value: OrganizationApplicationStatus | ""; label: string }[] = [
  { value: "", label: "Все статусы" },
  { value: "PENDING", label: "На рассмотрении" },
  { value: "APPROVED", label: "Одобрена" },
  { value: "REJECTED", label: "Отклонена" },
];

const STATUS_LABEL: Record<OrganizationApplicationStatus, string> = {
  PENDING: "На рассмотрении",
  APPROVED: "Одобрена",
  REJECTED: "Отклонена",
};

function statusVariant(
  s: OrganizationApplicationStatus,
): "app-pending" | "app-approved" | "app-rejected" {
  if (s === "APPROVED") return "app-approved";
  if (s === "REJECTED") return "app-rejected";
  return "app-pending";
}

export function OrganizationApplicationsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const statusParam = searchParams.get("status") as OrganizationApplicationStatus | null;
  const status =
    statusParam === "PENDING" || statusParam === "APPROVED" || statusParam === "REJECTED"
      ? statusParam
      : undefined;

  const { data, isLoading, error } = useQuery({
    queryKey: ["organization-applications", { page, limit: 20, status }],
    queryFn: () =>
      getOrganizationApplications({
        page,
        limit: 20,
        status,
      }),
  });

  function setStatusFilter(next: OrganizationApplicationStatus | "") {
    const params = new URLSearchParams(searchParams);
    if (next) params.set("status", next);
    else params.delete("status");
    params.set("page", "1");
    setSearchParams(params);
  }

  function setPage(newPage: number) {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(newPage));
    setSearchParams(params);
  }

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  if (error) {
    return (
      <div className="rounded-md border border-red-500/50 bg-red-500/10 p-4 text-red-400">
        Не удалось загрузить заявки.
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-[var(--color-text)] mb-6">
        Заявки организаций
      </h1>

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <Select
          label="Статус"
          options={STATUS_OPTIONS}
          value={status ?? ""}
          onChange={(e) =>
            setStatusFilter(e.target.value as OrganizationApplicationStatus | "")
          }
        />
      </div>

      {isLoading ? (
        <p className="text-[var(--color-muted)]">Загрузка…</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-surface">
                  <th className="px-4 py-3 font-display text-xs font-medium text-[var(--color-muted)] uppercase">
                    Отправлена
                  </th>
                  <th className="px-4 py-3 font-display text-xs font-medium text-[var(--color-muted)] uppercase">
                    Организация
                  </th>
                  <th className="px-4 py-3 font-display text-xs font-medium text-[var(--color-muted)] uppercase">
                    Заявитель
                  </th>
                  <th className="px-4 py-3 font-display text-xs font-medium text-[var(--color-muted)] uppercase">
                    Статус
                  </th>
                  <th className="px-4 py-3 font-display text-xs font-medium text-[var(--color-muted)] uppercase">
                    &nbsp;
                  </th>
                </tr>
              </thead>
              <tbody>
                {(data?.data ?? []).map((row: OrganizationApplicationListItem) => (
                  <tr
                    key={row.id}
                    className="border-b border-[var(--color-border)] hover:bg-surface/50"
                  >
                    <td className="px-4 py-3 text-sm text-[var(--color-muted)] whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text)]">
                      {row.organizationName}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text)]">
                      {row.user.email}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(row.status)}>{STATUS_LABEL[row.status]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/organization-applications/${row.id}`}
                        className="text-sm text-[var(--color-status-new)] hover:underline"
                      >
                        Рассмотреть
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.data.length === 0 && (
            <p className="mt-4 text-[var(--color-muted)] text-sm">Заявок нет.</p>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Назад
              </Button>
              <span className="text-sm text-[var(--color-muted)]">
                Страница {page} из {totalPages} (всего {data?.total ?? 0})
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Вперёд
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
