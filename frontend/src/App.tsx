import { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Header } from "./components/Header";
import { BottomNav } from "./components/BottomNav";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { WarRoom } from "./pages/WarRoom";
import { DropReceipts } from "./pages/DropReceipts";
import { FumbleRadar } from "./pages/FumbleRadar";
import { Sparring } from "./pages/Sparring";

function ProtectedShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-on-surface-variant font-body-md text-body-md">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <Header />
      <main className="flex-1 flex flex-col relative w-full min-h-screen pt-16 pb-28 bg-surface">{children}</main>
      <BottomNav />
    </>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedShell>
            <WarRoom />
          </ProtectedShell>
        }
      />
      <Route
        path="/receipts"
        element={
          <ProtectedShell>
            <DropReceipts />
          </ProtectedShell>
        }
      />
      <Route
        path="/fumble"
        element={
          <ProtectedShell>
            <FumbleRadar />
          </ProtectedShell>
        }
      />
      <Route
        path="/sparring"
        element={
          <ProtectedShell>
            <Sparring />
          </ProtectedShell>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
