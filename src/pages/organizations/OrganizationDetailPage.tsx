import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  createVenue,
  deleteVenue,
  getOrganizationById,
  removeOrganizationMember,
  updateVenue,
} from "../../api/admin";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import type {
  CreateVenuePayload,
  OrganizationMemberDetail,
  OrgMemberRole,
  UpdateVenuePayload,
  VenueDetail,
} from "../../types/api";

const ROLE_LABEL: Record<OrgMemberRole, string> = {
  OWNER: "Владелец",
  MANAGER: "Менеджер",
  OPERATOR: "Оператор",
  MEMBER: "Участник",
};

function extractError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (typeof msg === "string") return msg;
    if (Array.isArray(msg)) return msg.join(", ");
  }
  return fallback;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      className="font-display tracking-wider rounded-md border border-[var(--color-border)] bg-bg px-2 py-1 text-xs hover:bg-surface"
      title="Скопировать"
    >
      {copied ? "✓ скопировано" : value}
    </button>
  );
}

type VenueFormProps = {
  initial?: VenueDetail;
  submitting: boolean;
  error: string | null;
  submitLabel: string;
  onSubmit: (values: CreateVenuePayload) => void;
  onCancel: () => void;
};

function VenueForm({
  initial,
  submitting,
  error,
  submitLabel,
  onSubmit,
  onCancel,
}: VenueFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [latitude, setLatitude] = useState(
    initial?.latitude != null ? String(initial.latitude) : "",
  );
  const [longitude, setLongitude] = useState(
    initial?.longitude != null ? String(initial.longitude) : "",
  );

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const payload: CreateVenuePayload = { name: name.trim() };
    if (address.trim()) payload.address = address.trim();
    if (latitude.trim()) {
      const n = Number(latitude);
      if (Number.isFinite(n)) payload.latitude = n;
    }
    if (longitude.trim()) {
      const n = Number(longitude);
      if (Number.isFinite(n)) payload.longitude = n;
    }
    onSubmit(payload);
  };

  return (
    <form onSubmit={onSave} className="space-y-4">
      {error ? (
        <div
          role="alert"
          className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-400"
        >
          {error}
        </div>
      ) : null}
      <Input
        label="Название"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Wok Lagman — Чуй пр., 154"
        autoFocus
        required
      />
      <Input
        label="Адрес"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="пр. Чуй, 154, Бишкек"
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label="Широта"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          placeholder="42.876543"
          inputMode="decimal"
        />
        <Input
          label="Долгота"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          placeholder="74.604321"
          inputMode="decimal"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Отмена
        </Button>
        <Button type="submit" disabled={!name.trim() || submitting}>
          {submitting ? "Сохранение…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

type VenueBlockProps = {
  venue: VenueDetail;
  members: OrganizationMemberDetail[];
  onEdit: (venue: VenueDetail) => void;
  onDelete: (venue: VenueDetail) => void;
  onRemoveMember: (member: OrganizationMemberDetail) => void;
  removingMemberId: string | null;
};

function VenueBlock({
  venue,
  members,
  onEdit,
  onDelete,
  onRemoveMember,
  removingMemberId,
}: VenueBlockProps) {
  const hasCoords = venue.latitude != null && venue.longitude != null;
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${venue.latitude},${venue.longitude}`
    : null;

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-surface p-4 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="text-sm font-medium text-[var(--color-text)] break-words">
            {venue.name}
          </div>
          {venue.address ? (
            <div className="text-xs text-[var(--color-muted)]">{venue.address}</div>
          ) : null}
          {hasCoords ? (
            <a
              href={mapsUrl!}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-accent hover:underline"
            >
              {venue.latitude!.toFixed(6)}, {venue.longitude!.toFixed(6)} ↗
            </a>
          ) : (
            <div className="text-xs text-[var(--color-muted)]">Координаты не указаны</div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <CopyButton value={venue.inviteCode} />
          <Button size="sm" variant="secondary" onClick={() => onEdit(venue)}>
            Изменить
          </Button>
          <Button size="sm" variant="danger" onClick={() => onDelete(venue)}>
            Удалить
          </Button>
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] pt-2">
        <div className="text-xs font-medium text-[var(--color-muted)] mb-2">
          Привязанные участники ({members.length})
        </div>
        {members.length === 0 ? (
          <p className="text-xs text-[var(--color-muted)]">Никто не привязан к этой точке.</p>
        ) : (
          <ul className="space-y-1">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="text-sm text-[var(--color-text)] break-all">
                  {m.user.email}
                  <span className="ml-2 text-xs text-[var(--color-muted)]">
                    · {ROLE_LABEL[m.role] ?? m.role}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={removingMemberId === m.id || m.role === "OWNER"}
                  onClick={() => onRemoveMember(m)}
                  title={m.role === "OWNER" ? "Нельзя убрать владельца" : undefined}
                >
                  {removingMemberId === m.id ? "Убираем…" : "Убрать"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["organization-detail", id],
    queryFn: () => getOrganizationById(id!),
    enabled: !!id,
  });

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<VenueDetail | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VenueDetail | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [removeMemberError, setRemoveMemberError] = useState<string | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["organization-detail", id] });

  const createMutation = useMutation({
    mutationFn: (payload: CreateVenuePayload) => createVenue(id!, payload),
    onSuccess: () => {
      void invalidate();
      setShowCreate(false);
      setCreateError(null);
    },
    onError: (err) => setCreateError(extractError(err, "Не удалось создать точку")),
  });

  const updateMutation = useMutation({
    mutationFn: (input: { venueId: string; payload: UpdateVenuePayload }) =>
      updateVenue(input.venueId, input.payload),
    onSuccess: () => {
      void invalidate();
      setEditTarget(null);
      setEditError(null);
    },
    onError: (err) => setEditError(extractError(err, "Не удалось сохранить изменения")),
  });

  const deleteMutation = useMutation({
    mutationFn: (venueId: string) => deleteVenue(venueId),
    onSuccess: () => {
      void invalidate();
      setDeleteTarget(null);
      setDeleteError(null);
    },
    onError: (err) => setDeleteError(extractError(err, "Не удалось удалить точку")),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => removeOrganizationMember(memberId),
    onSuccess: () => {
      void invalidate();
      setRemoveMemberError(null);
    },
    onError: (err) =>
      setRemoveMemberError(extractError(err, "Не удалось убрать участника")),
  });

  const membersByVenue = useMemo(() => {
    const map = new Map<string, OrganizationMemberDetail[]>();
    if (!data) return map;
    for (const m of data.members) {
      if (m.venue?.id) {
        const list = map.get(m.venue.id) ?? [];
        list.push(m);
        map.set(m.venue.id, list);
      }
    }
    return map;
  }, [data]);

  const orgWideMembers = useMemo(
    () => (data ? data.members.filter((m) => m.venue == null) : []),
    [data],
  );

  if (error) {
    return (
      <div className="rounded-md border border-red-500/50 bg-red-500/10 p-4 text-red-400">
        Не удалось загрузить организацию.
      </div>
    );
  }

  if (isLoading || !data) {
    return <p className="text-[var(--color-muted)]">Загрузка…</p>;
  }

  return (
    <div className="space-y-6">
      <Link
        to="/organizations"
        className="inline-flex text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
      >
        ← К списку
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-text)]">
            {data.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
            <span className="font-display">{data.slug}</span>
            <span>·</span>
            <Badge variant={data.type === "BUSINESS" ? "app-approved" : "app-pending"}>
              {data.type === "BUSINESS" ? "Бизнес" : "Личная"}
            </Badge>
            <span>·</span>
            <span>Создана {new Date(data.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        {data.inviteCode ? (
          <div className="rounded-lg border border-[var(--color-border)] bg-surface p-3 sm:min-w-[200px]">
            <div className="text-xs text-[var(--color-muted)] mb-1">
              Код для приёма в организацию
            </div>
            <CopyButton value={data.inviteCode} />
          </div>
        ) : null}
      </div>

      {removeMemberError ? (
        <div
          role="alert"
          className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-400"
        >
          {removeMemberError}
        </div>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-lg font-semibold text-[var(--color-text)]">
            Точки ({data.venues.length})
          </h2>
          <Button onClick={() => setShowCreate(true)}>+ Добавить точку</Button>
        </div>

        {data.venues.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">У организации нет филиалов.</p>
        ) : (
          <div className="space-y-3">
            {data.venues.map((v) => (
              <VenueBlock
                key={v.id}
                venue={v}
                members={membersByVenue.get(v.id) ?? []}
                onEdit={(venue) => {
                  setEditError(null);
                  setEditTarget(venue);
                }}
                onDelete={(venue) => {
                  setDeleteError(null);
                  setDeleteTarget(venue);
                }}
                onRemoveMember={(member) => {
                  setRemoveMemberError(null);
                  removeMemberMutation.mutate(member.id);
                }}
                removingMemberId={
                  removeMemberMutation.isPending ? removeMemberMutation.variables ?? null : null
                }
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-[var(--color-text)]">
          Без привязки к точке ({orgWideMembers.length})
        </h2>

        {orgWideMembers.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">Нет участников без точки.</p>
        ) : (
          <div className="rounded-lg border border-[var(--color-border)] bg-surface divide-y divide-[var(--color-border)]">
            {orgWideMembers.map((m) => {
              const isOwner = m.role === "OWNER";
              return (
                <div
                  key={m.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="text-sm text-[var(--color-text)] break-all">
                    {m.user.email}
                    <span className="ml-2 text-xs text-[var(--color-muted)]">
                      · {ROLE_LABEL[m.role] ?? m.role}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={
                      isOwner ||
                      (removeMemberMutation.isPending &&
                        removeMemberMutation.variables === m.id)
                    }
                    onClick={() => {
                      setRemoveMemberError(null);
                      removeMemberMutation.mutate(m.id);
                    }}
                    title={isOwner ? "Нельзя убрать владельца" : undefined}
                  >
                    {removeMemberMutation.isPending &&
                    removeMemberMutation.variables === m.id
                      ? "Убираем…"
                      : "Убрать"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {showCreate && (
        <Modal isOpen title="Новая точка" onClose={() => setShowCreate(false)}>
          <VenueForm
            submitting={createMutation.isPending}
            error={createError}
            submitLabel="Создать"
            onSubmit={(payload) => createMutation.mutate(payload)}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      )}

      {editTarget && (
        <Modal isOpen title={`Редактирование: ${editTarget.name}`} onClose={() => setEditTarget(null)}>
          <VenueForm
            initial={editTarget}
            submitting={updateMutation.isPending}
            error={editError}
            submitLabel="Сохранить"
            onSubmit={(payload) =>
              updateMutation.mutate({ venueId: editTarget.id, payload })
            }
            onCancel={() => setEditTarget(null)}
          />
        </Modal>
      )}

      {deleteTarget && (
        <Modal isOpen title="Удалить точку?" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            {deleteError ? (
              <div
                role="alert"
                className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-400"
              >
                {deleteError}
              </div>
            ) : null}
            <p className="text-sm text-[var(--color-text)]">
              «{deleteTarget.name}» будет удалена. Привязанные участники потеряют связь с
              точкой (но останутся в организации). Историческая статистика SOS сохранится.
            </p>
            <p className="text-sm text-red-400">Действие необратимо.</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteMutation.isPending}
              >
                Отмена
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
              >
                {deleteMutation.isPending ? "Удаляем…" : "Удалить"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
