import { Link, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import PurchasesPage from "./pages/PurchasesPage";
import RegisterPage from "./pages/RegisterPage";

function NotFoundPage() {
  return (
    <div className="py-20 text-center">
      <h1 className="font-display text-6xl font-semibold">Page not found</h1>
      <p className="mt-4 text-ink/70">That road doesn’t lead anywhere.</p>
      <Link
        to="/"
        className="mt-8 inline-block border-2 border-ink px-5 py-3 text-xs font-bold uppercase tracking-widest transition hover:bg-ink hover:text-paper"
      >
        Back to the lot
      </Link>
    </div>
  );
}

/** Route table. Providers (router, auth, toasts) are supplied by the caller. */
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/purchases" element={<PurchasesPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
