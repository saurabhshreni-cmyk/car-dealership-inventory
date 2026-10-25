import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const navLink = ({ isActive }) =>
  `border-b-4 px-1 py-1 text-sm font-bold uppercase tracking-widest transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${
    isActive ? "border-signal" : "border-transparent hover:border-ink/40"
  }`;

/** Authenticated layout: header, navigation and the routed page. */
export default function AppShell() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const signOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>
      <header className="border-b-2 border-ink bg-paper">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 py-4 sm:px-8">
          <div className="flex flex-wrap items-center gap-x-10 gap-y-2">
            <p className="font-display text-3xl font-semibold tracking-tight">
              Lot<span className="text-signal">line</span>
            </p>
            <nav aria-label="Main" className="flex gap-6">
              <NavLink to="/" end className={navLink}>
                Dashboard
              </NavLink>
              <NavLink to="/purchases" className={navLink}>
                My purchases
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {isAdmin && <span className="border-2 border-ink bg-brass px-2 py-0.5 text-xs font-bold uppercase tracking-widest">Admin</span>}
            <span className="max-w-[16rem] truncate font-medium">{user?.email}</span>
            <button
              type="button"
              onClick={signOut}
              className="border-2 border-ink px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition hover:bg-ink hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
        <Outlet />
      </main>
    </div>
  );
}
