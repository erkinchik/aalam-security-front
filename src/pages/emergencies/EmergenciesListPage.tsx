import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getEmergencies, getOrganizations } from "../../api/admin";
import { Badge } from "../../components/ui/Badge";
import { Select } from "../../components/ui/Select";
import type { EmergencyStatus, EmergencySession } from "../../types/api";

const STATUS_OPTIONS: { value: EmergencyStatus | ""; label: string }[] = [
  { value: "", label: "Все статусы" },
  { value: "NEW", label: "Новая" },
  { value: "ASSIGNED", label: "Назначена" },
  { value: "IN_PROGRESS", label: "В работе" },
  { value: "CLOSED", label: "Закрыта" },
];

const STATUS_LABEL: Record<EmergencyStatus, string> = {
  NEW: "Новая",
  ASSIGNED: "Назначена",
  IN_PROGRESS: "В работе",
  CLOSED: "Закрыта",
};

function truncateId(id: string) {
  return id.slice(0, 8);
}

export function EmergenciesListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const status = (searchParams.get("status") as EmergencyStatus) || undefined;
  const organizationId = searchParams.get("organizationId") || undefined;
  const assigned = searchParams.get("assigned");
  const assignedFilter =
    assigned === "true" ? true : assigned === "false" ? false : undefined;

  const [statusFilter, setStatusFilter] = useState<EmergencyStatus | "">(
    status ?? ""
  );
  const [orgFilter, setOrgFilter] = useState(organizationId ?? "");
  const [assignedFilterState, setAssignedFilterState] = useState<string>(
    assigned ?? ""
  );

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "emergencies",
      { page, limit: 20, status: status || undefined, organizationId, assigned: assignedFilter },
    ],
    queryFn: () =>
      getEmergencies({
        page,
        limit: 20,
        status: status || undefined,
        organizationId: organizationId || undefined,
        assigned: assignedFilter,
      }),
  });

  const { data: organizations } = useQuery({
    queryKey: ["organizations"],
    queryFn: getOrganizations,
  });

  const orgOptions = (organizations ?? []).map((o) => ({
    value: o.id,
    label: o.name,
  }));

  function applyFilters() {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (orgFilter) params.set("organizationId", orgFilter);
    if (assignedFilterState) params.set("assigned", assignedFilterState);
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
        Не удалось загрузить тревоги. Попробуйте ещё раз.
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-[var(--color-text)] mb-6">
        Тревоги
      </h1>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="w-full sm:w-auto">
          <Select
            label="Статус"
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EmergencyStatus | "")}
          />
        </div>
        <div className="w-full sm:w-auto">
          <Select
            label="Организация"
            options={[{ value: "", label: "Все" }, ...orgOptions]}
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-auto">
          <Select
            label="Назначена"
            options={[
              { value: "", label: "Все" },
              { value: "true", label: "Да" },
              { value: "false", label: "Нет" },
            ]}
            value={assignedFilterState}
            onChange={(e) => setAssignedFilterState(e.target.value)}
          />
        </div>
        <button
          onClick={applyFilters}
          className="w-full sm:w-auto rounded-md bg-accent px-4 py-2 text-sm font-medium text-black hover:bg-amber-500"
        >
          Применить
        </button>
      </div>

      {isLoading ? (
        <p className="text-[var(--color-muted)]">Загрузка…</p>
      ) : (
        <>
          {/* mobile: cards */}
          <div className="md:hidden space-y-3">
            {(data?.data ?? []).map((e: EmergencySession) => (
              <Link
                key={e.id}
                to={`/emergencies/${e.id}`}
                className="block rounded-lg border border-[var(--color-border)] bg-surface p-4 space-y-2 hover:bg-surface/80"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--color-text)] truncate">
                      {e.user.email}
                    </div>
                    <div className="font-display text-xs text-[var(--color-muted)] mt-0.5">
                      {truncateId(e.id)}
                    </div>
                  </div>
                  <Badge
                    variant={
                      e.status === "NEW"
                        ? "new"
                        : e.status === "ASSIGNED"
                        ? "assigned"
                        : e.status === "IN_PROGRESS"
                        ? "in-progress"
                        : "closed"
                    }
                  >
                    {STATUS_LABEL[e.status]}
                  </Badge>
                </div>
                <div className="text-xs text-[var(--color-muted)] space-y-0.5">
                  <div>Организация: <span className="text-[var(--color-text)]">{e.organization?.name ?? "—"}</span></div>
                  <div>Назначен: <span className="text-[var(--color-text)]">{e.assignedOperator?.email ?? "—"}</span></div>
                  <div>Создана: {new Date(e.createdAt).toLocaleString()}</div>
                </div>
              </Link>
            ))}
            {(data?.data ?? []).length === 0 && (
              <p className="text-sm text-[var(--color-muted)] text-center py-8">Ничего не найдено</p>
            )}
          </div>

          {/* desktop: table */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-[var(--color-border)]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-surface">
                  <th className="px-4 py-3 font-display text-xs font-medium text-[var(--color-muted)] uppercase">
                    ID
                  </th>
                  <th className="px-4 py-3 font-display text-xs font-medium text-[var(--color-muted)] uppercase">
                    Пользователь
                  </th>
                  <th className="px-4 py-3 font-display text-xs font-medium text-[var(--color-muted)] uppercase">
                    Организация
                  </th>
                  <th className="px-4 py-3 font-display text-xs font-medium text-[var(--color-muted)] uppercase">
                    Статус
                  </th>
                  <th className="px-4 py-3 font-display text-xs font-medium text-[var(--color-muted)] uppercase">
                    Назначен
                  </th>
                  <th className="px-4 py-3 font-display text-xs font-medium text-[var(--color-muted)] uppercase">
                    Создана
                  </th>
                  <th className="px-4 py-3 font-display text-xs font-medium text-[var(--color-muted)] uppercase">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {(data?.data ?? []).map((e: EmergencySession) => (
                  <tr
                    key={e.id}
                    className="border-b border-[var(--color-border)] hover:bg-surface/50"
                  >
                    <td className="px-4 py-3 font-display text-sm text-[var(--color-text)]">
                      {truncateId(e.id)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text)]">
                      {e.user.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-muted)]">
                      {e.organization?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          e.status === "NEW"
                            ? "new"
                            : e.status === "ASSIGNED"
                            ? "assigned"
                            : e.status === "IN_PROGRESS"
                            ? "in-progress"
                            : "closed"
                        }
                      >
                        {STATUS_LABEL[e.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-muted)]">
                      {e.assignedOperator?.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-muted)]">
                      {new Date(e.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/emergencies/${e.id}`}
                        className="text-accent hover:underline text-sm"
                      >
                        Открыть
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="rounded-md border border-[var(--color-border)] px-3 py-1 text-sm disabled:opacity-50"
              >
                Назад
              </button>
              <span className="flex items-center px-3 text-sm text-[var(--color-muted)]">
                Страница {page} из {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="rounded-md border border-[var(--color-border)] px-3 py-1 text-sm disabled:opacity-50"
              >
                Вперёд
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
