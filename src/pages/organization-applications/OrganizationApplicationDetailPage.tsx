import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOrganizationApplicationById,
  approveOrganizationApplication,
  rejectOrganizationApplication,
} from "../../api/admin";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import type { OrganizationApplicationStatus, OrganizationType } from "../../types/api";

function statusVariant(
  s: OrganizationApplicationStatus,
): "app-pending" | "app-approved" | "app-rejected" {
  if (s === "APPROVED") return "app-approved";
  if (s === "REJECTED") return "app-rejected";
  return "app-pending";
}

const TYPE_OPTIONS: { value: OrganizationType; label: string }[] = [
  { value: "BUSINESS", label: "Бизнес" },
  { value: "PERSONAL", label: "Личная" },
];

const STATUS_LABEL: Record<OrganizationApplicationStatus, string> = {
  PENDING: "На рассмотрении",
  APPROVED: "Одобрена",
  REJECTED: "Отклонена",
};

const ORG_TYPE_LABEL: Record<string, string> = {
  PERSONAL: "Личная",
  BUSINESS: "Бизнес",
};

export function OrganizationApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [approveName, setApproveName] = useState("");
  const [approveType, setApproveType] = useState<OrganizationType>("BUSINESS");
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["organization-application", id],
    queryFn: () => getOrganizationApplicationById(id!),
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: () =>
      approveOrganizationApplication(id!, {
        organizationName: approveName.trim() || undefined,
        organizationType: approveType,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-application", id] });
      queryClient.invalidateQueries({ queryKey: ["organization-applications"] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      setShowApprove(false);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectOrganizationApplication(id!, rejectReason.trim() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-application", id] });
      queryClient.invalidateQueries({ queryKey: ["organization-applications"] });
      setShowReject(false);
      setRejectReason("");
    },
  });

  if (!id) return null;

  if (error) {
    return (
      <div className="rounded-md border border-red-500/50 bg-red-500/10 p-4 text-red-400">
        Не удалось загрузить заявку.
      </div>
    );
  }

  if (isLoading || !data) {
    return <p className="text-[var(--color-muted)]">Загрузка…</p>;
  }

  const pending = data.status === "PENDING";

  function openApproveModal() {
    if (!data) return;
    setApproveName(data.organizationName);
    setApproveType(
      data.organizationType.toUpperCase() === "PERSONAL" ? "PERSONAL" : "BUSINESS",
    );
    setShowApprove(true);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
      >
        ← Назад
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-text)]">
            {data.organizationName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(data.status)}>{STATUS_LABEL[data.status]}</Badge>
            <span className="text-sm text-[var(--color-muted)]">
              {new Date(data.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
        {pending && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowReject(true)}>
              Отклонить
            </Button>
            <Button size="sm" onClick={openApproveModal}>
              Одобрить
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-6 rounded-lg border border-[var(--color-border)] bg-surface p-6">
        <div>
          <h2 className="text-sm font-medium text-[var(--color-muted)] mb-1">Заявитель</h2>
          <p className="text-[var(--color-text)]">{data.user.email}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-[var(--color-muted)] mb-1">Контакты</h2>
          <p className="text-[var(--color-text)]">{data.contactEmail}</p>
          <p className="text-[var(--color-text)]">{data.contactPhone}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-[var(--color-muted)] mb-1">Тип (запрошенный)</h2>
          <p className="text-[var(--color-text)]">
            {ORG_TYPE_LABEL[data.organizationType.toUpperCase()] ?? data.organizationType}
          </p>
        </div>
        {data.description && (
          <div>
            <h2 className="text-sm font-medium text-[var(--color-muted)] mb-1">Описание</h2>
            <p className="text-[var(--color-text)] whitespace-pre-wrap">{data.description}</p>
          </div>
        )}
        <div>
          <h2 className="text-sm font-medium text-[var(--color-muted)] mb-2">Филиалы</h2>
          <ul className="space-y-2">
            {data.branches.map((b, i) => (
              <li
                key={`${b.name}-${i}`}
                className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)]"
              >
                <span className="font-medium">{b.name}</span>
                {b.address ? (
                  <span className="block text-[var(--color-muted)] mt-0.5">{b.address}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-medium text-[var(--color-muted)] mb-2">Вложения</h2>
          {data.attachments.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">Нет</p>
          ) : (
            <>
              <p className="text-sm text-[var(--color-muted)] mb-3 rounded-md border border-[var(--color-border)] bg-bg px-3 py-2">
                Файлы пока не хранятся на сервере: приложение передаёт только имя, тип и размер
                файла. Открыть или скачать вложения нельзя, пока загрузка не будет реализована
                на API и в мобильном клиенте.
              </p>
              <ul className="space-y-2 text-sm text-[var(--color-text)]">
                {data.attachments.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-md border border-[var(--color-border)] px-3 py-2"
                  >
                    <span className="font-medium">{a.fileName}</span>
                    <span className="text-[var(--color-muted)]">
                      {" "}
                      ({a.mimeType}
                      {a.sizeBytes != null ? `, ${a.sizeBytes} байт` : ""})
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        {data.status === "APPROVED" && data.approvedOrganization && (
          <div>
            <h2 className="text-sm font-medium text-[var(--color-muted)] mb-1">
              Созданная организация
            </h2>
            <Link
              to="/organizations"
              className="text-[var(--color-status-new)] hover:underline"
            >
              {data.approvedOrganization.name} ({data.approvedOrganization.slug})
            </Link>
            <span className="text-sm text-[var(--color-muted)] ml-2">
              {ORG_TYPE_LABEL[data.approvedOrganization.type] ?? data.approvedOrganization.type}
            </span>
          </div>
        )}
        {data.status === "REJECTED" && data.rejectionReason && (
          <div>
            <h2 className="text-sm font-medium text-[var(--color-muted)] mb-1">
              Причина отклонения
            </h2>
            <p className="text-[var(--color-text)] whitespace-pre-wrap">
              {data.rejectionReason}
            </p>
          </div>
        )}
      </div>

      {showApprove && (
        <Modal
          isOpen={showApprove}
          onClose={() => setShowApprove(false)}
          title="Одобрение заявки"
        >
          <p className="text-sm text-[var(--color-muted)] mb-4">
            Создаёт организацию, объекты на основании филиалов (с кодами приглашения)
            и назначает заявителя владельцем.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              approveMutation.mutate();
            }}
            className="space-y-4"
          >
            <Input
              label="Название организации"
              value={approveName}
              onChange={(e) => setApproveName(e.target.value)}
              required
            />
            <Select
              label="Тип организации"
              options={TYPE_OPTIONS}
              value={approveType}
              onChange={(e) => setApproveType(e.target.value as OrganizationType)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowApprove(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={approveMutation.isPending}>
                {approveMutation.isPending ? "Одобрение…" : "Одобрить"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {showReject && (
        <Modal
          isOpen={showReject}
          onClose={() => setShowReject(false)}
          title="Отклонение заявки"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              rejectMutation.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">
                Причина (необязательно)
              </label>
              <textarea
                className="w-full rounded-md border border-[var(--color-border)] bg-bg px-3 py-2 text-sm text-[var(--color-text)] min-h-[100px]"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Видна только внутри системы, для аудита"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowReject(false)}>
                Отмена
              </Button>
              <Button type="submit" variant="danger" disabled={rejectMutation.isPending}>
                {rejectMutation.isPending ? "Отклонение…" : "Отклонить"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
