import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity,
  BarChart3,
  Bot,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Command,
  CreditCard,
  FileText,
  GraduationCap,
  Handshake,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  Megaphone,
  PlugZap,
  Settings2,
  ShieldCheck,
  UserRound,
  UsersRound,
  Workflow,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { label: "Overview", href: "/", icon: LayoutDashboard, group: "COMMAND" },
  { label: "CRM & pipeline", href: "/crm", icon: UsersRound, group: "COMMAND", badge: "crm" },
  { label: "Agents", href: "/agents", icon: Bot, group: "INTELLIGENCE" },
  { label: "Workflows", href: "/workflows", icon: Workflow, group: "INTELLIGENCE" },
  { label: "Approvals", href: "/approvals", icon: ShieldCheck, group: "INTELLIGENCE", badge: "approvals" },
  { label: "Websites & funnels", href: "/funnels", icon: FileText, group: "GROWTH" },
  { label: "Campaigns & email", href: "/marketing", icon: Megaphone, group: "GROWTH" },
  { label: "Automations", href: "/automations", icon: Workflow, group: "GROWTH" },
  { label: "Analytics", href: "/analytics", icon: BarChart3, group: "GROWTH" },
  { label: "Products & payments", href: "/commerce", icon: CreditCard, group: "BUSINESS" },
  { label: "Courses & memberships", href: "/courses", icon: GraduationCap, group: "BUSINESS" },
  { label: "Bookings", href: "/bookings", icon: CalendarDays, group: "BUSINESS" },
  { label: "Affiliates", href: "/affiliates", icon: Handshake, group: "BUSINESS" },
  { label: "Integrations", href: "/integrations", icon: PlugZap, group: "BUSINESS" },
];

const titles: Record<string, string> = {
  "/": "Overview",
  "/crm": "CRM & pipeline",
  "/agents": "Agent command",
  "/workflows": "Workflows",
  "/approvals": "Approval queue",
  "/funnels": "Websites & funnels",
  "/marketing": "Campaigns & email",
  "/automations": "Automation builder",
  "/analytics": "Business intelligence",
  "/commerce": "Products & payments",
  "/courses": "Courses & memberships",
  "/bookings": "Booking calendar",
  "/affiliates": "Affiliate program",
  "/integrations": "Integrations",
  "/settings": "Workspace settings",
};

type WorkspaceShellProps = {
  children: ReactNode;
  displayName: string;
  leadCount: number;
  pendingCount: number;
  onLogout: () => void;
};

function BrandMark() {
  return (
    <div className="brand-lockup" aria-label="BUGDATA Agentic OS">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none">
          <path d="M7 7h17v7H14v11H7V7Z" fill="currentColor" />
          <path d="M18 18h7v7h-7z" fill="currentColor" opacity=".55" />
          <path d="m19 7 6 6" stroke="currentColor" strokeWidth="2" />
        </svg>
      </span>
      <span className="brand-type"><strong>BUGDATA</strong><small>AGENTIC OS</small></span>
    </div>
  );
}

export default function WorkspaceShell({ children, displayName, leadCount, pendingCount, onLogout }: WorkspaceShellProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const title = titles[location] ?? "Command center";
  const initial = displayName.trim().charAt(0).toUpperCase() || "B";

  return (
    <div className="os-frame">
      {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={cn("sidebar", mobileOpen && "sidebar-open")}>
        <div className="sidebar-head">
          <BrandMark />
          <button className="icon-button sidebar-dismiss" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={17} /></button>
        </div>
        <button className="workspace-switcher" type="button" aria-label="Current workspace">
          <span className="workspace-avatar">B</span>
          <span className="workspace-copy"><strong>BUGDATA workspace</strong><small>OWNER PLAN</small></span>
          <ChevronDown size={14} className="switch-caret" />
        </button>
        <div className="sidebar-scroll">
          {Array.from(new Set(navigation.map(item => item.group))).map(group => (
            <section className="nav-group" key={group}>
              <div className="nav-group-label">{group}</div>
              {navigation.filter(item => item.group === group).map(item => {
                const Icon = item.icon;
                const active = location === item.href || (item.href !== "/" && location.startsWith(`${item.href}/`));
                const count = item.badge === "crm" ? leadCount : item.badge === "approvals" ? pendingCount : 0;
                return (
                  <Link href={item.href} key={item.href} onClick={() => setMobileOpen(false)}>
                    <span className={cn("nav-link", active && "nav-link-active")}>
                      <Icon size={17} strokeWidth={1.8} />
                      <span>{item.label}</span>
                      {item.badge === "approvals" && count > 0 && <span className="nav-count">{count}</span>}
                    </span>
                  </Link>
                );
              })}
            </section>
          ))}
        </div>
        <div className="sidebar-bottom">
          <Link href="/settings"><span className={cn("nav-link", location === "/settings" && "nav-link-active")}><Settings2 size={17} /><span>Settings</span></span></Link>
          <div className="sidebar-status"><span className="status-pip" /><span>Core systems ready</span><span className="status-version">v0.1</span></div>
          <button className="account-button" onClick={onLogout} title="Sign out">
            <span className="account-avatar">{initial}</span>
            <span className="account-copy"><strong>{displayName || "Account"}</strong><small>Workspace owner</small></span>
            <span className="account-logout">Sign out</span>
          </button>
        </div>
      </aside>

      <div className="os-main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu-button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={19} /></button>
            <span className="breadcrumb-home"><Activity size={14} /> OPERATIONS</span>
            <span className="breadcrumb-divider">/</span>
            <span className="breadcrumb-current">{title}</span>
            <Link href="/agents"><span className="topbar-command"><Command size={15} /><span>Talk to Hermes</span><kbd>⌘ K</kbd></span></Link>
          </div>
          <div className="topbar-actions">
            <span className="live-indicator"><i /> WORKSPACE LIVE</span>
            <button className="icon-button topbar-help" aria-label="Help"><CircleHelp size={17} /></button>
            <button className="topbar-account" onClick={onLogout} title="Sign out" aria-label={`Sign out ${displayName || "of BUGDATA"}`}>
              <span className="topbar-account-avatar"><UserRound size={14} /></span>
              <span className="topbar-account-copy"><strong>{displayName || "Account"}</strong><small>Sign out</small></span>
            </button>
          </div>
        </header>
        <main className="page-canvas">{children}</main>
        <footer className="app-footer"><span>BUGDATA AGENTIC OS <span className="footer-dot">/</span> PRIVATE WORKSPACE</span><span><LifeBuoy size={13} /> Human oversight is always in the loop</span></footer>
      </div>
    </div>
  );
}

export { BrandMark };
