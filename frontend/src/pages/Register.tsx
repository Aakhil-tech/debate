import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";

export function Register() {
  const { user, loading, register } = useAuth();
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email, password, handle);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="h-16 px-margin flex items-center gap-space-sm">
        <img
          src="/logo.jpeg"
          alt="Debate & Win logo"
          className="h-8 w-8 rounded-sm object-cover"
          style={{ border: "1.5px solid #000" }}
        />
        <span className="font-headline-md text-headline-md text-on-surface uppercase tracking-tight">
          Debate &amp; Win
        </span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-margin gap-space-xl">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm flex flex-col gap-space-md bg-surface-container-lowest rounded-DEFAULT p-space-lg shadow-[3px_3px_0px_#000000]"
          style={{ border: "2px solid #000" }}
        >
          <h1 className="font-headline-lg text-headline-lg uppercase tracking-tight">Register</h1>
          <div className="flex flex-col gap-space-xs">
            <label className="font-label-sm text-label-sm uppercase text-on-surface-variant" htmlFor="handle">
              Handle
            </label>
            <input
              id="handle"
              required
              minLength={2}
              maxLength={30}
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="overthinker"
              className="p-space-sm rounded-DEFAULT bg-surface-container-low text-on-surface outline-none"
              style={{ border: "1.5px solid #000" }}
            />
          </div>
          <div className="flex flex-col gap-space-xs">
            <label className="font-label-sm text-label-sm uppercase text-on-surface-variant" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="p-space-sm rounded-DEFAULT bg-surface-container-low text-on-surface outline-none"
              style={{ border: "1.5px solid #000" }}
            />
          </div>
          <div className="flex flex-col gap-space-xs">
            <label className="font-label-sm text-label-sm uppercase text-on-surface-variant" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-space-sm rounded-DEFAULT bg-surface-container-low text-on-surface outline-none"
              style={{ border: "1.5px solid #000" }}
            />
          </div>
          {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="py-3 rounded-full bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wide disabled:opacity-50"
          >
            {submitting ? "Creating account…" : "Create Account"}
          </button>
        </form>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-on-surface underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
