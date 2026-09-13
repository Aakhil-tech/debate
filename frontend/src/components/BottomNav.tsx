import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/", label: "War Room", icon: "swords" },
  { to: "/receipts", label: "Receipts", icon: "receipt_long" },
  { to: "/fumble", label: "Fumble", icon: "crisis_alert" },
  { to: "/sparring", label: "Sparring", icon: "smart_toy" },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 w-full z-50 pb-safe pointer-events-none">
      <div className="px-margin pb-space-md flex justify-center w-full">
        <div className="pointer-events-auto flex items-center gap-space-xs p-1.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-space-xs px-space-md py-2 rounded-full font-label-md text-label-md uppercase transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-variant hover:text-on-surface"
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
