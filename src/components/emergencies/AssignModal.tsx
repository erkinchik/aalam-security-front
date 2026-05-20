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

  const { data: operators } = useQuery({
    queryKey: ["operators"],
    queryFn: () => getOperators(),
  });

  const options = (operators ?? [])
    .filter((o) => o.id !== excludeOperatorId)
    .map((o) => ({
      value: o.id,
      label: `${o.email} ${o.isOnline ? "(онлайн)" : ""}`,
    }));

  return (
    <Modal isOpen={true} title={title} onClose={onClose}>
      <Select
        label="Оператор"
        options={options}
        value={operatorId}
        onChange={(e) => setOperatorId(e.target.value)}
        placeholder="Выберите оператора"
      />
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Отмена
        </Button>
        <Button
          disabled={!operatorId || isLoading}
          onClick={() => operatorId && onAssign(operatorId)}
        >
          {isLoading ? "Назначение…" : "Назначить"}
        </Button>
      </div>
    </Modal>
  );
}
