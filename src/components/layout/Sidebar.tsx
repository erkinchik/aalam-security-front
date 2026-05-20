import { NavLink } from "react-router-dom";
import logoUrl from "../../assets/logo.png";

const navItems = [
  { to: "/", label: "Главная" },
  { to: "/emergencies", label: "Тревоги" },
  { to: "/operators", label: "Операторы" },
  { to: "/organizations", label: "Организации" },
  { to: "/organization-applications", label: "Заявки организаций" },
  { to: "/subscription-requests", label: "Заявки на подписку" },
];

export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-[var(--color-border)] bg-surface">
      <div className="flex h-full flex-col">
        <div className="p-4 border-b border-[var(--color-border)] flex items-center gap-3">
          <img src={logoUrl} alt="SOS Security" className="h-9 w-9 rounded-lg shrink-0" />
          <div className="min-w-0">
            <h1 className="font-display text-lg font-semibold text-[var(--color-text)] leading-tight truncate">
              SOS Security
            </h1>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">Админ-панель</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent/20 text-accent"
                    : "text-[var(--color-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)]"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}
