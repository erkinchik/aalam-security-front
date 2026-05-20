import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { getOperators, getOrganizations } from "../../api/admin";
import { Select } from "../../components/ui/Select";

export function OperatorsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const organizationId = searchParams.get("organizationId") || undefined;

  const { data: operators, isLoading, error } = useQuery({
    queryKey: ["operators", organizationId],
    queryFn: () => getOperators(organizationId),
  });

  const { data: organizations } = useQuery({
    queryKey: ["organizations"],
    queryFn: getOrganizations,
  });

  const orgOptions = (organizations ?? []).map((o) => ({
    value: o.id,
    label: o.name,
  }));

  function handleOrgFilter(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams);
    if (e.target.value) {
      params.set("organizationId", e.target.value);
    } else {
      params.delete("organizationId");
    }
    setSearchParams(params);
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-500/50 bg-red-500/10 p-4 text-red-400">
        Не удалось загрузить операторов.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <h1 className="font-display text-2xl font-semibold text-[var(--color-text)]">
          Операторы
        </h1>
        <Link
          to="/operators/new"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-black hover:bg-amber-500"
        >
          Создать оператора
        </Link>
      </div>

      <div className="mb-6 max-w-xs">
        <Select
          label="Фильтр по организации"
          options={[{ value: "", label: "Все" }, ...orgOptions]}
          value={organizationId ?? ""}
          onChange={handleOrgFilter}
        />
      </div>

      {isLoading ? (
        <p className="text-[var(--color-muted)]">Загрузка…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-surface">
                <th className="px-4 py-3 font-display text-xs font-medium text-[var(--color-muted)] uppercase">
                  Email
                </th>
                <th className="px-4 py-3 font-display text-xs font-medium text-[var(--color-muted)] uppercase">
                  Организации
                </th>
                <th className="px-4 py-3 font-display text-xs font-medium text-[var(--color-muted)] uppercase">
                  Статус
                </th>
                <th className="px-4 py-3 font-display text-xs font-medium text-[var(--color-muted)] uppercase">
                  Активных сессий
                </th>
              </tr>
            </thead>
            <tbody>
              {(operators ?? []).map((op) => (
                <tr
                  key={op.id}
                  className="border-b border-[var(--color-border)] hover:bg-surface/50"
                >
                  <td className="px-4 py-3 text-sm text-[var(--color-text)]">
                    {op.email}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-muted)]">
                    {op.orgMemberships.map((m: { organization: { name: string } }) => m.organization.name).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex h-2 w-2 rounded-full ${
                        op.isOnline ? "bg-status-closed" : "bg-[var(--color-muted)]"
                      }`}
                      title={op.isOnline ? "Онлайн" : "Не в сети"}
                    />
                    <span className="ml-2 text-sm text-[var(--color-muted)]">
                      {op.isOnline ? "Онлайн" : "Не в сети"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-text)]">
                    {op.activeSessionCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
