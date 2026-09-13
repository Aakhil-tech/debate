import { useAuth } from "../context/AuthContext";

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl">
      <div className="h-16 px-margin flex items-center justify-between">
        <div className="flex items-center gap-space-sm">
          <img
            src="/logo.jpeg"
            alt="Debate & Win logo"
            className="h-8 w-8 rounded-sm object-cover"
            style={{ border: "1.5px solid #000" }}
          />
          <div className="flex items-center gap-space-xs">
            <span className="font-headline-md text-headline-md text-on-surface uppercase tracking-tight">
              Debate &amp; Win
            </span>
            <span className="px-space-xs py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed font-label-sm text-label-sm uppercase">
              3.0
            </span>
          </div>
        </div>
        {user && (
          <button
            onClick={logout}
            aria-label="Log out"
            title={`Log out @${user.handle}`}
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-label-sm text-label-sm uppercase"
          >
            {user.handle.slice(0, 1)}
          </button>
        )}
      </div>
    </header>
  );
}
