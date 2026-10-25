import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AuthLayout from "../components/AuthLayout";
import FormField from "../components/FormField";
import { SUBMIT_BUTTON } from "../components/styles";

const MIN_PASSWORD_LENGTH = 8;

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const bind = (name) => ({
    value: form[name],
    onChange: (e) => setForm((current) => ({ ...current, [name]: e.target.value })),
  });

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    try {
      await register(form.email.trim(), form.password);
    } catch (err) {
      setError(err.message);
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Regular accounts can browse and purchase vehicles."
      footer={
        <>
          Already registered?{" "}
          <Link to="/login" className="font-bold underline decoration-2 underline-offset-4 hover:text-signal">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField label="Email" type="email" autoComplete="email" required {...bind("email")} />
        <FormField
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          maxLength={72}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          {...bind("password")}
        />
        <FormField label="Confirm password" type="password" autoComplete="new-password" required {...bind("confirm")} />
        {error && (
          <p role="alert" className="border-2 border-signal bg-signal/10 px-3 py-2 text-sm font-medium text-signal">
            {error}
          </p>
        )}
        <button type="submit" disabled={pending} className={SUBMIT_BUTTON}>
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
