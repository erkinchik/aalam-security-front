import { useEffect, useState } from "react";

function format(totalSec: number): string {
  const s = Math.max(0, totalSec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h} ч ${String(m).padStart(2, "0")} мин`;
  if (m > 0) return `${m} мин ${String(sec).padStart(2, "0")} с`;
  return `${sec} с`;
}

type Props = {
  createdAt: string;
  /** Заполнено — вызов закрыт, показываем итоговую длительность без тиканья. */
  closedAt?: string | null;
};

/**
 * Сколько вызов уже ждёт (или сколько длился, если закрыт).
 *
 * Для дежурного это главный ориентир в списке: свежая тревога и висящая
 * двадцать минут требуют разной реакции, а по времени создания это на глаз
 * не считается. Поэтому у открытых вызовов время подсвечивается по мере
 * старения.
 *
 * Значение пересчитывается от системных часов, а не накапливается счётчиком:
 * в фоновой вкладке браузер режет таймеры, и накопление отстало бы навсегда.
 */
export function WaitingTime({ createdAt, closedAt }: Props) {
  const startMs = new Date(createdAt).getTime();
  const endMs = closedAt ? new Date(closedAt).getTime() : null;

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (endMs !== null) return; // закрытый вызов не тикает
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endMs]);

  const seconds = Math.floor(((endMs ?? now) - startMs) / 1000);

  if (endMs !== null) {
    return <span className="text-[var(--color-muted)]">длился {format(seconds)}</span>;
  }

  // Пороги подобраны под тревожную кнопку: до пяти минут — рабочая ситуация,
  // после пятнадцати — уже тревожная сама по себе.
  const tone =
    seconds >= 900
      ? "text-red-400 font-medium"
      : seconds >= 300
        ? "text-amber-400"
        : "text-[var(--color-text)]";

  return <span className={tone}>ждёт {format(seconds)}</span>;
}
