import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSubscriptionRequestById,
  approveSubscriptionRequest,
  rejectSubscriptionRequest,
} from "../../api/admin";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import type { SubscriptionRequestStatus } from "../../types/api";

function statusVariant(
  s: SubscriptionRequestStatus,
): "app-pending" | "app-approved" | "app-rejected" {
  if (s === "APPROVED") return "app-approved";
  if (s === "REJECTED") return "app-rejected";
  return "app-pending";
}

const STATUS_LABEL: Record<SubscriptionRequestStatus, string> = {
  PENDING: "На рассмотрении",
  APPROVED: "Одобрена",
  REJECTED: "Отклонена",
};

function defaultExpiryDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  // YYYY-MM-DD for <input type="date">
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function SubscriptionRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string>(defaultExpiryDate());
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["subscription-request", id],
    queryFn: () => getSubscriptionRequestById(id!),
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: () => {
      // Convert YYYY-MM-DD (local) to end-of-day ISO string so the subscription
      // is active for the whole selected day in the user's timezone.
      const [y, m, d] = expiresAt.split("-").map((v) => Number(v));
      const local = new Date(y, m - 1, d, 23, 59, 59, 999);
      return approveSubscriptionRequest(id!, { expiresAt: local.toISOString() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-request", id] });
      queryClient.invalidateQueries({ queryKey: ["subscription-requests"] });
      setShowApprove(false);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () =>
      rejectSubscriptionRequest(id!, rejectReason.trim() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-request", id] });
      queryClient.invalidateQueries({ queryKey: ["subscription-requests"] });
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
    setExpiresAt(defaultExpiryDate());
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
            Заявка на подписку
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(data.status)}>
              {STATUS_LABEL[data.status]}
            </Badge>
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
          <h2 className="text-sm font-medium text-[var(--color-muted)] mb-1">
            Пользователь
          </h2>
          <p className="text-[var(--color-text)]">{data.user.email}</p>
          {data.user.displayName ? (
            <p className="text-sm text-[var(--color-muted)]">
              {data.user.displayName}
            </p>
          ) : null}
          {data.user.phone ? (
            <p className="text-sm text-[var(--color-muted)]">{data.user.phone}</p>
          ) : null}
        </div>

        {data.comment && (
          <div>
            <h2 className="text-sm font-medium text-[var(--color-muted)] mb-1">
              Комментарий
            </h2>
            <p className="text-[var(--color-text)] whitespace-pre-wrap">
              {data.comment}
            </p>
          </div>
        )}

        {data.status === "APPROVED" && (
          <div className="space-y-1">
            <div>
              <h2 className="text-sm font-medium text-[var(--color-muted)] mb-1">
                Действует до
              </h2>
              <p className="text-[var(--color-text)]">
                {data.expiresAt
                  ? new Date(data.expiresAt).toLocaleString()
                  : "—"}
              </p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-[var(--color-muted)] mb-1">
                Одобрена
              </h2>
              <p className="text-[var(--color-text)]">
                {data.approvedAt
                  ? new Date(data.approvedAt).toLocaleString()
                  : "—"}
                {data.approvedByUser ? ` · ${data.approvedByUser.email}` : ""}
              </p>
            </div>
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
            Активирует подписку пользователя до указанной даты. По умолчанию — 30
            дней. Дата может быть изменена.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              approveMutation.mutate();
            }}
            className="space-y-4"
          >
            <Input
              label="Действует до"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowApprove(false)}
              >
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
                placeholder="Будет видна пользователю в мобильном приложении"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowReject(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                variant="danger"
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending ? "Отклонение…" : "Отклонить"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
