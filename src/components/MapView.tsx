import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/** Бишкек — разумный центр по умолчанию, пока точка не выбрана. */
const DEFAULT_CENTER: [number, number] = [42.8746, 74.5698];
const DEFAULT_ZOOM = 12;

export type MapMarker = {
  position: [number, number];
  /** Подпись во всплывающем окне. */
  label?: string;
  /** Объект — куда едет группа; человек — где реально находится. */
  kind?: "venue" | "person";
  /** Клик по маркеру — например, переход к карточке вызова. */
  onClick?: () => void;
};

type Props = {
  markers?: MapMarker[];
  /** GPS-трек: как двигался человек во время вызова. */
  track?: Array<[number, number]>;
  center?: [number, number];
  zoom?: number;
  height?: number;
  /**
   * Режим выбора точки: клик по карте отдаёт координаты наверх.
   * Третьим аргументом приходит адрес — он известен только когда точку выбрали
   * из результатов поиска, при обычном клике по карте его нет.
   */
  onPick?: (lat: number, lng: number, address?: string) => void;
};

/**
 * Обёртка над Leaflet без react-leaflet.
 *
 * Почему без обёртки: react-leaflet жёстко привязан к версии React, и на
 * каждом обновлении пришлось бы ждать совместимый релиз. Здесь же Leaflet
 * управляется вручную в useEffect — зависимость одна и версии React не касается.
 *
 * Тайлы OSM. Провайдер меняется одной строкой в tileLayer, поэтому переход на
 * 2GIS или Google при появлении ключа не потребует переписывания компонента.
 */
export function MapView({ markers = [], track, center, zoom, height = 320, onPick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  // Через ref, чтобы новая функция на каждый рендер не пересоздавала карту.
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  // Инициализация — ровно один раз за жизнь компонента.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: center ?? DEFAULT_CENTER,
      zoom: zoom ?? DEFAULT_ZOOM,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      // Указание авторства обязательно по лицензии OSM.
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      onPickRef.current?.(e.latlng.lat, e.latlng.lng);
    });

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Карта часто живёт в модальном окне: на момент создания контейнер имеет
    // нулевой размер, и Leaflet рисует серый прямоугольник вместо тайлов.
    // Одного пересчёта мало — окно может открываться с анимацией, поэтому
    // следим за размером и пересчитываем на каждое изменение. Заодно это
    // покрывает поворот экрана и ресайз окна.
    const raf = requestAnimationFrame(() => map.invalidateSize());
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Перерисовка содержимого при смене данных.
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    const icon = (kind: MapMarker["kind"]) =>
      L.divIcon({
        // divIcon вместо стандартной иконки: у Leaflet она грузится по
        // относительному пути и ломается в сборке Vite. Тут разметка своя,
        // никаких внешних файлов.
        className: "",
        html: `<div style="
          width:16px;height:16px;border-radius:50%;
          background:${kind === "person" ? "#38bdf8" : "#f43f5e"};
          border:2px solid #fff;box-shadow:0 0 0 2px rgba(0,0,0,.35);
        "></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

    for (const m of markers) {
      const marker = L.marker(m.position, { icon: icon(m.kind) }).addTo(layer);
      if (m.label) marker.bindPopup(m.label);
      if (m.onClick) {
        marker.on("click", m.onClick);
        marker.getElement()?.style.setProperty("cursor", "pointer");
      }
    }

    if (track && track.length > 1) {
      L.polyline(track, { color: "#38bdf8", weight: 3, opacity: 0.8 }).addTo(layer);
    }

    // Подгоняем видимую область под все точки, чтобы ничего не осталось за краем.
    const points: Array<[number, number]> = [...markers.map((m) => m.position), ...(track ?? [])];
    if (points.length === 1) {
      map.setView(points[0], Math.max(map.getZoom(), 16));
    } else if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 17 });
    }
  }, [markers, track]);

  // ── поиск адреса (Nominatim, геокодер самого OSM — ключ не нужен) ─────────
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ label: string; lat: number; lon: number }>>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearchError(null);
    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("q", q);
      url.searchParams.set("format", "json");
      url.searchParams.set("limit", "5");
      // Ограничиваем Кыргызстаном: иначе «Чуй» находит улицы по всему миру.
      url.searchParams.set("countrycodes", "kg");
      url.searchParams.set("accept-language", "ru");
      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      const data: Array<{ display_name: string; lat: string; lon: string }> = await res.json();
      setResults(
        data.map((r) => ({ label: r.display_name, lat: Number(r.lat), lon: Number(r.lon) })),
      );
      if (data.length === 0) setSearchError("Ничего не найдено");
    } catch {
      setSearchError("Поиск недоступен. Поставьте точку на карте вручную.");
    } finally {
      setSearching(false);
    }
  };

  const pickResult = (r: { label: string; lat: number; lon: number }) => {
    setResults([]);
    setQuery(r.label);
    mapRef.current?.setView([r.lat, r.lon], 17);
    onPickRef.current?.(r.lat, r.lon, r.label);
  };

  return (
    <div className="space-y-2">
      {onPick ? (
        <div className="relative">
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm text-[var(--color-text)]"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Найти адрес: Чуй 100, Бишкек"
              onKeyDown={(e) => {
                // Внутри формы Enter отправил бы её целиком — перехватываем.
                if (e.key === "Enter") {
                  e.preventDefault();
                  void search();
                }
              }}
            />
            <button
              type="button"
              className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] disabled:opacity-50"
              disabled={searching || !query.trim()}
              onClick={() => void search()}
            >
              {searching ? "Ищем…" : "Найти"}
            </button>
          </div>
          {searchError ? <p className="mt-1 text-xs text-amber-400">{searchError}</p> : null}
          {results.length > 0 ? (
            <ul className="absolute z-[1000] mt-1 w-full overflow-hidden rounded-md border border-[var(--color-border)] bg-surface shadow-lg">
              {results.map((r) => (
                <li key={`${r.lat},${r.lon}`}>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-xs text-[var(--color-text)] hover:bg-[var(--color-border)]/30"
                    onClick={() => pickResult(r)}
                  >
                    {r.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

    <div
      ref={containerRef}
      style={{ height, width: "100%" }}
      className="rounded-lg border border-[var(--color-border)] overflow-hidden z-0"
    />
    </div>
  );
}
