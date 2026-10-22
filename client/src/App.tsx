import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { BrandMark } from "./components/bugdata/WorkspaceShell";
import { ArrowRight, Check, ShieldCheck, Sparkles } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

function LoadingScreen() {
  return <div className="auth-screen"><div className="auth-loading"><BrandMark /><span className="loading-line" /><p>Opening your command center…</p></div></div>;
}

function SignInScreen() {
  return (
    <div className="auth-screen">
      <div className="auth-layout">
        <section className="auth-story">
          <BrandMark />
          <div className="auth-copy">
            <span className="eyebrow"><span className="status-pip" /> THE BUSINESS, IN MOTION</span>
            <h1>Your business has a new <em>operating system.</em></h1>
            <p>One command center for your customers, workflows, and AI agents—built to keep you in control.</p>
            <div className="auth-points">
              <span><Check size={15} /> Your leads stay yours</span>
              <span><Check size={15} /> Agents work with permission</span>
              <span><Check size={15} /> Every action stays visible</span>
            </div>
          </div>
          <div className="auth-story-footer">BUGDATA / A MORE CAPABLE WAY TO RUN BUSINESS</div>
        </section>
        <section className="auth-card-wrap">
          <div className="auth-card">
            <div className="auth-card-icon"><Sparkles size={20} /></div>
            <span className="eyebrow">YOUR PRIVATE WORKSPACE</span>
            <h2>Sign in to continue</h2>
            <p>Use your Manus account to open your workspace. Your CRM and approvals are private to your signed-in account.</p>
            <Button className="sign-in-button" onClick={() => startLogin()}><span>Continue with Manus</span><ArrowRight size={17} /></Button>
            <div className="auth-security"><ShieldCheck size={15} /><span>Secure sign-in · No password stored here</span></div>
          </div>
          <div className="auth-card-footer">By continuing, you authenticate with your Manus account.</div>
        </section>
      </div>
    </div>
  );
}

export default function App() {
  const auth = useAuth();

  if (auth.loading) return <LoadingScreen />;
  if (!auth.isAuthenticated || !auth.user) return <SignInScreen />;

  return (
    <ThemeProvider defaultTheme="light">
      <Toaster />
      <Home user={auth.user} onLogout={auth.logout} />
    </ThemeProvider>
  );
}
