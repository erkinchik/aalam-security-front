import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteOperator,
  getOperator,
  setOperatorPassword,
  setOperatorShift,
  updateOperator,
} from "../../api/admin";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { apiErrorMessage } from "../../utils/apiError";
import type { OperatorDetail } from "../../types/api";

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("ru-RU");
}

export function OperatorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const { data: operator, isLoading, isError } = useQuery({
    queryKey: ["operator", id],
    queryFn: () => getOperator(id!),
    enabled: !!id,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["operator", id] });
    void queryClient.invalidateQueries({ queryKey: ["operators"] });
  };

  const saveMutation = useMutation({
    mutationFn: (values: { email: string; displayName: string; phone: string }) =>
      updateOperator(id!, {
        email: values.email.trim(),
        displayName: values.displayName.trim() || undefined,
        phone: values.phone.trim() || undefined,
      }),
    onMutate: () => {
      setFormError(null);
      setNotice(null);
    },
    onSuccess: () => {
      invalidate();
      setNotice("Сохранено");
    },
    onError: (err) => setFormError(apiErrorMessage(err, "Не удалось сохранить")),
  });

  const shiftMutation = useMutation({
    mutationFn: () => setOperatorShift(id!, !operator!.onShift),
    onMutate: () => setFormError(null),
    onSuccess: invalidate,
    onError: (err) => setFormError(apiErrorMessage(err, "Не удалось изменить смену")),
  });

  const passwordMutation = useMutation({
    mutationFn: () => setOperatorPassword(id!, password),
    onSuccess: () => {
      setPasswordOpen(false);
      setPassword("");
      setNotice("Пароль изменён, прежние сессии оператора отозваны");
    },
    onError: (err) => setFormError(apiErrorMessage(err, "Не удалось сменить пароль")),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteOperator(id!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["operators"] });
      navigate("/operators");
    },
    onError: (err) => {
      setDeleteOpen(false);
      setFormError(apiErrorMessage(err, "Не удалось удалить оператора"));
    },
  });

  if (isLoading) {
    return <p className="text-sm text-[var(--color-muted)]">Загрузка…</p>;
  }

  if (isError || !operator) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-400">Оператор не найден</p>
        <Link to="/operators" className="text-sm text-accent hover:underline">
          ← К списку операторов
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/operators" className="text-sm text-[var(--color-muted)] hover:underline">
          ← Операторы
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
          {operator.displayName || operator.email}
        </h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatusTile
          label="Смена"
          value={operator.onShift ? "На смене" : "Не на смене"}
          accent={operator.onShift}
        />
        <StatusTile
          label="Связь"
          value={operator.isOnline ? "Онлайн" : "Не в сети"}
          accent={operator.isOnline}
        />
        <StatusTile label="Открытых вызовов" value={String(operator.activeSessionCount)} />
        <StatusTile label="Создан" value={formatDateTime(operator.createdAt)} />
      </div>

      {formError && (
        <div className="rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
          {formError}
        </div>
      )}
      {notice && (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-400">
          {notice}
        </div>
      )}

      {/* key сбрасывает форму, когда открыли другого оператора: без него
          начальные значения пришлось бы досинхронизировать эффектом. */}
      <OperatorForm
        key={operator.id}
        operator={operator}
        saving={saveMutation.isPending}
        onSave={(values) => saveMutation.mutate(values)}
      />

      <div className="space-y-3 rounded-lg border border-[var(--color-border)] bg-surface p-4">
        <h2 className="font-display text-xs uppercase text-[var(--color-muted)]">Доступ</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => shiftMutation.mutate()}
            disabled={shiftMutation.isPending}
          >
            {operator.onShift ? "Снять со смены" : "Поставить на смену"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setPasswordOpen(true)}>
            Сменить пароль
          </Button>
        </div>
        <p className="text-xs text-[var(--color-muted)]">
          Смена пароля отзывает все сессии оператора — на телефоне придётся войти заново.
        </p>
      </div>

      <div className="space-y-3 rounded-lg border border-red-500/30 bg-red-500/5 p-4">
        <h2 className="font-display text-xs uppercase text-red-400">Удаление</h2>
        <p className="text-sm text-[var(--color-muted)]">
          Контакты стираются, вход закрывается, оператор пропадает из списка. История
          вызовов сохраняется — иначе нельзя будет ответить, кто их вёл. Отменить нельзя.
        </p>
        <Button type="button" variant="danger" onClick={() => setDeleteOpen(true)}>
          Удалить оператора
        </Button>
      </div>

      <Modal isOpen={passwordOpen} title="Новый пароль" onClose={() => setPasswordOpen(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              passwordMutation.mutate();
            }}
            className="space-y-4"
          >
            <Input
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="минимум 8 символов"
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setPasswordOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={password.length < 8 || passwordMutation.isPending}>
                {passwordMutation.isPending ? "Сохранение…" : "Сменить"}
              </Button>
            </div>
        </form>
      </Modal>

      <Modal isOpen={deleteOpen} title="Удалить оператора?" onClose={() => setDeleteOpen(false)}>
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-muted)]">
              Введите email оператора, чтобы подтвердить:{" "}
              <span className="text-[var(--color-text)]">{operator.email}</span>
            </p>
            <Input
              label="Email"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setDeleteOpen(false)}>
                Отмена
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={deleteConfirm.trim() !== operator.email || deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                {deleteMutation.isPending ? "Удаление…" : "Удалить"}
              </Button>
            </div>
        </div>
      </Modal>
    </div>
  );
}

function OperatorForm({
  operator,
  saving,
  onSave,
}: {
  operator: OperatorDetail;
  saving: boolean;
  onSave: (values: { email: string; displayName: string; phone: string }) => void;
}) {
  const [email, setEmail] = useState(operator.email);
  const [displayName, setDisplayName] = useState(operator.displayName ?? "");
  const [phone, setPhone] = useState(operator.phone ?? "");

  return (
    <form
      className="space-y-4 rounded-lg border border-[var(--color-border)] bg-surface p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ email, displayName, phone });
      }}
    >
      <h2 className="font-display text-xs uppercase text-[var(--color-muted)]">Данные</h2>
      <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input
        label="Имя"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="например, Иван Петров"
      />
      <Input
        label="Телефон"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+996555123456"
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={!email.trim() || saving}>
          {saving ? "Сохранение…" : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}

function StatusTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-surface p-3">
      <p className="font-display text-xs uppercase text-[var(--color-muted)]">{label}</p>
      <p
        className={`mt-1 text-sm font-medium ${
          accent ? "text-status-closed" : "text-[var(--color-text)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
