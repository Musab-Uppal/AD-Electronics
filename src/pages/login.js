import { redirectIfAuthenticated } from "@/lib/session";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Login failed");
      }

      toast.success("Welcome back");
      await router.push("/");
    } catch (error) {
      toast.error(error.message || "Could not log in");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>Login | Installment Desk</title>
      </Head>

      <main className="flex min-h-screen items-center justify-center bg-[conic-gradient(at_top,_#fde68a,_#fffbeb,_#e2e8f0)] px-4 py-12">
        <section className="w-full max-w-md rounded-3xl border border-amber-200 bg-white/90 p-8 shadow-xl backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
            Installment Desk
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Admin Login
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Sign in with your admin credentials to continue.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                className="mb-1 block text-sm font-medium text-slate-700"
                htmlFor="username"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-amber-200 transition focus:ring"
              />
            </div>

            <div>
              <label
                className="mb-1 block text-sm font-medium text-slate-700"
                htmlFor="password"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-amber-200 transition focus:ring"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </section>
      </main>
    </>
  );
}

export const getServerSideProps = redirectIfAuthenticated;
