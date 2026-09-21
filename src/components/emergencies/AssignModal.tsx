import { useQuery } from "@tanstack/react-query";
import { getOperators } from "../../api/admin";
import { Modal } from "../ui/Modal";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { useState } from "react";

interface AssignModalProps {
  title?: string;
  onClose: () => void;
  onAssign: (operatorId: string) => void;
  isLoading: boolean;
  excludeOperatorId?: string;
}

export function AssignModal({
  title = "Назначить оператору",
  onClose,
  onAssign,
  isLoading,
  excludeOperatorId,
}: AssignModalProps) {
  const [operatorId, setOperatorId] = useState("");

  // Выпадашка показывает всех: страница берётся заведомо большая.
  const { data: operatorsPage } = useQuery({
    queryKey: ["operators", "all"],
    queryFn: () => getOperators(1, 100),
  });
  const operators = operatorsPage?.data ?? [];

  const options = operators
    .filter((o) => o.id !== excludeOperatorId)
    // Дежурные наверх: они реально увидят назначение прямо сейчас.
    .sort((a, b) => Number(b.onShift) - Number(a.onShift) || a.email.localeCompare(b.email))
    .map((o) => {
      const marks = [
        o.onShift ? "на смене" : "вне смены",
        o.isOnline ? "онлайн" : null,
        o.activeSessionCount > 0 ? `вызовов: ${o.activeSessionCount}` : null,
      ].filter(Boolean);
      return { value: o.id, label: `${o.email} — ${marks.join(", ")}` };
    });

  const selected = (operators ?? []).find((o) => o.id === operatorId);

  return (
    <Modal isOpen={true} title={title} onClose={onClose}>
      <Select
        label="Оператор"
        options={options}
        value={operatorId}
        onChange={(e) => setOperatorId(e.target.value)}
        placeholder="Выберите оператора"
      />
      {selected && !selected.onShift && (
        <p className="mt-2 text-xs text-amber-400">
          Оператор не на смене — сначала включите ему смену.
        </p>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Отмена
        </Button>
        <Button
          // Сервер откажет: вне смены приложение показывает оператору только
          // экран начала смены, и назначенный вызов он бы не увидел.
          disabled={!operatorId || isLoading || (selected != null && !selected.onShift)}
          onClick={() => operatorId && onAssign(operatorId)}
        >
          {isLoading ? "Назначение…" : "Назначить"}
        </Button>
      </div>
    </Modal>
  );
}
