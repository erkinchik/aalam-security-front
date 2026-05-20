import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrganizations, createOrganization } from "../../api/admin";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";

const ORG_TYPES = [
  { value: "PERSONAL", label: "Личная" },
  { value: "BUSINESS", label: "Бизнес" },
];

const ORG_TYPE_LABEL: Record<string, string> = {
  PERSONAL: "Личная",
  BUSINESS: "Бизнес",
};

export function OrganizationsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"PERSONAL" | "BUSINESS">("BUSINESS");

  const queryClient = useQueryClient();
  const { data: organizations, isLoading, error } = useQuery({
    queryKey: ["organizations"],
    queryFn: getOrganizations,
  });

  const createMutation = useMutation({
    mutationFn: (dto: { name: string; type?: "PERSONAL" | "BUSINESS" }) =>
      createOrganization(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      setShowCreate(false);
      setName("");
      setType("BUSINESS");
    },
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim(), type });
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-500/50 bg-red-500/10 p-4 text-red-400">
        Не удалось загрузить организации.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <h1 className="font-display text-2xl font-semibold text-[var(--color-text)]">
          Организации
        </h1>
        <Button onClick={() => setShowCreate(true)}>Создать организацию</Button>
      </div>

      {isLoading ? (
        <p className="text-[var(--color-muted)]">Загрузка…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-surface">
                <th className="px-4 py-3 font-display text-xs font-medium text-[var(--color-muted)] uppercase">
                  Название
                </th>
                <th className="px-4 py-3 font-display text-xs font-medium text-[var(--color-muted)] uppercase">
                  Идентификатор
                </th>
                <th className="px-4 py-3 font-display text-xs font-medium text-[var(--color-muted)] uppercase">
                  Тип
                </th>
              </tr>
            </thead>
            <tbody>
              {(organizations ?? []).map((org) => (
                <tr
                  key={org.id}
                  className="border-b border-[var(--color-border)] hover:bg-surface/50"
                >
                  <td className="px-4 py-3 text-sm text-[var(--color-text)]">
                    {org.name}
                  </td>
                  <td className="px-4 py-3 font-display text-sm text-[var(--color-muted)]">
                    {org.slug}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-muted)]">
                    {ORG_TYPE_LABEL[org.type] ?? org.type}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <Modal
          isOpen={true}
          title="Создание организации"
          onClose={() => setShowCreate(false)}
        >
          <form onSubmit={handleCreate} className="space-y-4">
            {createMutation.isError && (
              <div
                role="alert"
                className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-400"
              >
                {createMutation.error &&
                typeof createMutation.error === "object" &&
                "response" in createMutation.error
                  ? (createMutation.error as { response?: { data?: { message?: string } } })
                      .response?.data?.message ?? "Не удалось создать организацию"
                  : "Не удалось создать организацию"}
              </div>
            )}
            <Input
              label="Название"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="например, Додо Пицца"
              autoFocus
            />
            <Select
              label="Тип"
              options={ORG_TYPES}
              value={type}
              onChange={(e) =>
                setType(e.target.value as "PERSONAL" | "BUSINESS")
              }
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCreate(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={!name.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? "Создание…" : "Создать"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
