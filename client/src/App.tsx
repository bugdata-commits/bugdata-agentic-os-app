import { useState, type FormEvent } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { BrandMark } from "./components/bugdata/WorkspaceShell";
import { ArrowRight, Check, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

function LoadingScreen() {
  return <div className="auth-screen"><div className="auth-loading"><BrandMark /><span className="loading-line" /><p>Opening your command center…</p></div></div>;
}

function SignInScreen({ signIn, signUp, error }: { signIn: (email: string, password: string) => Promise<unknown>; signUp: (email: string, password: string, name: string) => Promise<unknown>; error: Error | null }) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (mode === "sign-up") {
        const result = await signUp(email, password, name);
        if (typeof result === "object" && result !== null && "session" in result && !result.session) setMessage("Check your inbox to confirm your email, then sign in.");
      } else {
        await signIn(email, password);
      }
    } catch {
      // The hook exposes the provider error below without leaking server details.
    } finally {
      setBusy(false);
    }
  }

  return <div className="auth-screen"><div className="auth-layout"><section className="auth-story"><BrandMark /><div className="auth-copy"><span className="eyebrow"><span className="status-pip" /> THE BUSINESS, IN MOTION</span><h1>Your business has a new <em>operating system.</em></h1><p>One command center for your customers, workflows, and AI agents—built to keep you in control.</p><div className="auth-points"><span><Check size={15} /> Your leads stay yours</span><span><Check size={15} /> Agents work with permission</span><span><Check size={15} /> Every action stays visible</span></div></div><div className="auth-story-footer">BUGDATA / A MORE CAPABLE WAY TO RUN BUSINESS</div></section><section className="auth-card-wrap"><div className="auth-card"><div className="auth-card-icon"><Sparkles size={20} /></div><span className="eyebrow">YOUR PRIVATE WORKSPACE</span><h2>{mode === "sign-in" ? "Sign in to continue" : "Create your workspace"}</h2><p>{mode === "sign-in" ? "Use your BUGDATA account to open your private workspace." : "Start with a secure account. Your workspace is created when you first enter."}</p><form className="auth-form" onSubmit={submit}>{mode === "sign-up" && <label><span><UserRound size={13} /> Full name</span><input required autoComplete="name" value={name} onChange={event => setName(event.target.value)} placeholder="Your name" /></label>}<label><span><Mail size={13} /> Email</span><input required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@company.com" /></label><label><span><LockKeyhole size={13} /> Password</span><input required minLength={8} type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 8 characters" /></label>{(error || message) && <div className={`auth-form-message ${error ? "auth-form-error" : ""}`}>{error?.message || message}</div>}<button className="sign-in-button" type="submit" disabled={busy}><span>{busy ? "Working…" : mode === "sign-in" ? "Sign in securely" : "Create account"}</span><ArrowRight size={17} /></button></form><button className="auth-mode-toggle" onClick={() => { setMode(mode === "sign-in" ? "sign-up" : "sign-in"); setMessage(""); }}>{mode === "sign-in" ? "Need an account? Create one" : "Already have an account? Sign in"}</button><div className="auth-security"><ShieldCheck size={15} /><span>Supabase Auth · Encrypted session · No passwords stored by BUGDATA</span></div></div><div className="auth-card-footer">By continuing, you agree to use BUGDATA for your own business data and authorized contacts.</div></section></div></div>;
}

export default function App() {
  const auth = useAuth();
  if (auth.loading) return <LoadingScreen />;
  if (!auth.isAuthenticated || !auth.user) return <SignInScreen signIn={auth.signIn} signUp={auth.signUp} error={auth.error instanceof Error ? auth.error : null} />;
  return <ThemeProvider defaultTheme="light"><Toaster /><Home user={auth.user} onLogout={auth.logout} /></ThemeProvider>;
}
