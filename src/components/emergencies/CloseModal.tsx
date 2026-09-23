import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface CloseModalProps {
  onClose: () => void;
  onCloseEmergency: (resolution?: string) => void;
  isLoading: boolean;
  /** Ошибка показывается внутри окна — под ним, на странице, её не видно. */
  error?: string | null;
}

export function CloseModal({
  onClose,
  onCloseEmergency,
  isLoading,
  error,
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
      {error ? (
        <p className="mt-3 rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      ) : null}
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
