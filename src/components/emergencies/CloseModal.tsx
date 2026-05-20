import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface CloseModalProps {
  onClose: () => void;
  onCloseEmergency: (resolution?: string) => void;
  isLoading: boolean;
}

export function CloseModal({
  onClose,
  onCloseEmergency,
  isLoading,
}: CloseModalProps) {
  const [resolution, setResolution] = useState("");

  return (
    <Modal isOpen={true} title="Закрытие тревоги" onClose={onClose}>
      <Input
        label="Результат (необязательно)"
        value={resolution}
        onChange={(e) => setResolution(e.target.value)}
        placeholder="например, Решено на месте"
      />
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Отмена
        </Button>
        <Button
          variant="danger"
          disabled={isLoading}
          onClick={() => onCloseEmergency(resolution || undefined)}
        >
          {isLoading ? "Закрытие…" : "Закрыть"}
        </Button>
      </div>
    </Modal>
  );
}
