import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEmergencyById,
  assignEmergency,
  reassignEmergency,
  unassignEmergency,
  closeEmergency,
} from "../../api/admin";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { AssignModal } from "../../components/emergencies/AssignModal";
import { CloseModal } from "../../components/emergencies/CloseModal";
import type { EmergencyLocation } from "../../types/api";

function truncateId(id: string) {
  return id.slice(0, 8);
}

const STATUS_LABEL = {
  NEW: "Новая",
  ASSIGNED: "Назначена",
  IN_PROGRESS: "В работе",
  CLOSED: "Закрыта",
} as const;

/** Google Maps: точка по координатам WGS84 (метка на карте). */
function buildGoogleMapsUrl(latitude: number, longitude: number): string {
  const q = `${latitude},${longitude}`;
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}`;
}

export function EmergencyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["emergency", id],
    queryFn: () => getEmergencyById(id!),
    enabled: !!id,
  });

  const assignMutation = useMutation({
    mutationFn: ({ operatorId }: { operatorId: string }) =>
      assignEmergency(id!, operatorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency", id] });
      queryClient.invalidateQueries({ queryKey: ["emergencies"] });
      setShowAssign(false);
    },
  });

  const reassignMutation = useMutation({
    mutationFn: ({ operatorId }: { operatorId: string }) =>
      reassignEmergency(id!, operatorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency", id] });
      queryClient.invalidateQueries({ queryKey: ["emergencies"] });
      setShowReassign(false);
    },
  });

  const unassignMutation = useMutation({
    mutationFn: () => unassignEmergency(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency", id] });
      queryClient.invalidateQueries({ queryKey: ["emergencies"] });
    },
  });

  const closeMutation = useMutation({
    mutationFn: ({ resolution }: { resolution?: string }) =>
      closeEmergency(id!, resolution),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency", id] });
      queryClient.invalidateQueries({ queryKey: ["emergencies"] });
      setShowClose(false);
    },
  });

  const [showAssign, setShowAssign] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [showClose, setShowClose] = useState(false);

  if (!id) return null;
  if (error) {
    return (
      <div className="rounded-md border border-red-500/50 bg-red-500/10 p-4 text-red-400">
        Не удалось загрузить тревогу.
      </div>
    );
  }
  if (isLoading || !data) {
    return <p className="text-[var(--color-muted)]">Загрузка…</p>;
  }

  const canAssign = data.status !== "CLOSED" && !data.assignedOperatorId;
  const canReassign = data.status !== "CLOSED" && !!data.assignedOperatorId;
  const canUnassign = data.status !== "CLOSED" && !!data.assignedOperatorId;
  const canClose = data.status !== "CLOSED";

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
      >
        ← Назад
      </button>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-text)]">
            Тревога {truncateId(data.id)}
          </h1>
          <Badge
            variant={
              data.status === "NEW"
                ? "new"
                : data.status === "ASSIGNED"
                ? "assigned"
                : data.status === "IN_PROGRESS"
                ? "in-progress"
                : "closed"
            }
          >
            {STATUS_LABEL[data.status]}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2 [&>button]:w-full sm:[&>button]:w-auto">
          {canAssign && (
            <Button size="sm" onClick={() => setShowAssign(true)}>
              Назначить
            </Button>
          )}
          {canReassign && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowReassign(true)}
            >
              Переназначить
            </Button>
          )}
          {canUnassign && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => unassignMutation.mutate()}
              disabled={unassignMutation.isPending}
            >
              Снять назначение
            </Button>
          )}
          {canClose && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowClose(true)}
            >
              Закрыть
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6 rounded-lg border border-[var(--color-border)] bg-surface p-6">
        <div>
          <h2 className="text-sm font-medium text-[var(--color-muted)] mb-1">Пользователь</h2>
          <p className="text-[var(--color-text)]">{data.user.email}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-[var(--color-muted)] mb-1">Организация</h2>
          <p className="text-[var(--color-text)]">{data.organization?.name ?? "—"}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-[var(--color-muted)] mb-1">Объект</h2>
          <p className="text-[var(--color-text)]">{data.venue?.name ?? "—"}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-[var(--color-muted)] mb-1">Назначенный оператор</h2>
          <p className="text-[var(--color-text)]">{data.assignedOperator?.email ?? "—"}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-[var(--color-muted)] mb-1">Создана</h2>
          <p className="text-[var(--color-text)]">{new Date(data.createdAt).toLocaleString()}</p>
        </div>
        {data.resolution && (
          <div>
            <h2 className="text-sm font-medium text-[var(--color-muted)] mb-1">Результат</h2>
            <p className="text-[var(--color-text)]">{data.resolution}</p>
          </div>
        )}
        {(data.locations?.length ?? 0) > 0 && (
          <div>
            <h2 className="text-sm font-medium text-[var(--color-muted)] mb-2">Координаты</h2>
            <ul className="space-y-2">
              {(data.locations ?? []).map((loc: EmergencyLocation) => (
                <li
                  key={loc.id}
                  className="font-display text-sm text-[var(--color-text)]"
                >
                  {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)} (точность:{" "}
                  {loc.accuracy} м) — {new Date(loc.createdAt).toLocaleString()}{" "}
                  <a
                    href={buildGoogleMapsUrl(loc.latitude, loc.longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-status-new)] underline decoration-[var(--color-status-new)]/50 underline-offset-2 hover:decoration-[var(--color-status-new)]"
                  >
                    Google Maps
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {showAssign && (
        <AssignModal
          onClose={() => setShowAssign(false)}
          onAssign={(operatorId) => assignMutation.mutate({ operatorId })}
          isLoading={assignMutation.isPending}
        />
      )}
      {showReassign && (
        <AssignModal
          title="Переназначить оператору"
          onClose={() => setShowReassign(false)}
          onAssign={(operatorId) => reassignMutation.mutate({ operatorId })}
          isLoading={reassignMutation.isPending}
          excludeOperatorId={data.assignedOperatorId ?? undefined}
        />
      )}
      {showClose && (
        <CloseModal
          onClose={() => setShowClose(false)}
          onCloseEmergency={(resolution) => closeMutation.mutate({ resolution })}
          isLoading={closeMutation.isPending}
        />
      )}
    </div>
  );
}
