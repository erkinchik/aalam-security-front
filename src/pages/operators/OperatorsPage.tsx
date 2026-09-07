import { useState } from "react";
import { Link } from "react-router-dom";
import { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getOperators, setOperatorShift } from "../../api/admin";
import type { OperatorWithStatus } from "../../types/api";

function shiftLabel(op: OperatorWithStatus): string {
  if (!op.onShift) return "Не на смене";
  if (!op.shiftStartedAt) return "На смене";
  const since = new Date(op.shiftStartedAt).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `На смене с ${since}`;
}

export function OperatorsPage() {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: operators, isLoading, error } = useQuery({
    queryKey: ["operators"],
    queryFn: getOperators,
  });

  const shiftMutation = useMutation({
    mutationFn: ({ id, onShift }: { id: string; onShift: boolean }) =>
      setOperatorShift(id, onShift),
    onMutate: () => setActionError(null),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["operators"] });
    },
    onError: (err) => {
      // 409 приходит с причиной — у оператора остались незакрытые вызовы.
      const data =
        err instanceof AxiosError
          ? (err.response?.data as { message?: string | string[] } | undefined)
          : undefined;
      const message = Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
      setActionError(message || "Не удалось изменить смену");
    },
  });

  const toggleShift = (op: OperatorWithStatus) =>
    shiftMutation.mutate({ id: op.id, onShift: !op.onShift });

  const isBusy = (id: string) =>
    shiftMutation.isPending && shiftMutation.variables?.id === id;

  if (error) {
    return (
      <div className="rounded-md border border-red-500/50 bg-red-500/10 p-4 text-red-400">
        Не удалось загрузить операторов.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-text)]">
            Операторы
          </h1>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Новый SOS рассылается всем операторам на смене — кто первый принял, тот и ведёт вызов.
          </p>
        </div>
        <Link
          to="/operators/new"
          className="w-full sm:w-auto rounded-md bg-accent px-4 py-2 text-sm font-medium text-black text-center hover:bg-amber-500"
        >
          Создать оператора
        </Link>
      </div>

      {actionError && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="font-bold">
            ✕
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="text-[var(--color-muted)]">Загрузка…</p>
      ) : (
        <>
          {/* mobile: cards */}
          <div className="md:hidden space-y-3">
            {(operators ?? []).map((op) => (
              <div
                key={op.id}
                className="rounded-lg border border-[var(--color-border)] bg-surface p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-medium text-[var(--color-text)] truncate">
                    {op.email}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`inline-flex h-2 w-2 rounded-full ${
                        op.isOnline ? "bg-status-closed" : "bg-[var(--color-muted)]"
                      }`}
                    />
                    <span className="text-xs text-[var(--color-muted)]">
                      {op.isOnline ? "Онлайн" : "Не в сети"}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-[var(--color-muted)] space-y-0.5">
                  <div>
                    Смена:{" "}
                    <span className={op.onShift ? "text-status-closed" : "text-[var(--color-text)]"}>
                      {shiftLabel(op)}
                    </span>
                  </div>
                  <div>
                    Активных сессий:{" "}
                    <span className="text-[var(--color-text)]">{op.activeSessionCount}</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleShift(op)}
                  disabled={isBusy(op.id)}
                  className="w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-xs font-medium text-[var(--color-text)] hover:bg-surface/50 disabled:opacity-50"
                >
                  {op.onShift ? "Снять со смены" : "Поставить на смену"}
                </button>
              </div>
            ))}
            {(operators ?? []).length === 0 && (
              <p className="text-sm text-[var(--color-muted)] text-center py-8">
                Ничего не найдено
              </p>
            )}
          </div>

          {/* desktop: table */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-[var(--color-border)]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-surface">
                  <th className="px-4 py-3 font-display text-xs font-medium text-[var(--color-muted)] uppercase">
                    Email
                  </th>
                  <th className="px-4 py-3 font-display text-xs font-medium text-[var(--color-muted)] uppercase">
                    Смена
                  </th>
                  <th className="px-4 py-3 font-display text-xs font-medium text-[var(--color-muted)] uppercase">
                    Статус
                  </th>
                  <th className="px-4 py-3 font-display text-xs font-medium text-[var(--color-muted)] uppercase">
                    Активных сессий
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {(operators ?? []).map((op) => (
                  <tr
                    key={op.id}
                    className="border-b border-[var(--color-border)] hover:bg-surface/50"
                  >
                    <td className="px-4 py-3 text-sm text-[var(--color-text)]">{op.email}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={op.onShift ? "text-status-closed" : "text-[var(--color-muted)]"}>
                        {shiftLabel(op)}
                      </span>
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
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleShift(op)}
                        disabled={isBusy(op.id)}
                        className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] hover:bg-surface/50 disabled:opacity-50"
                      >
                        {op.onShift ? "Снять со смены" : "Поставить на смену"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
