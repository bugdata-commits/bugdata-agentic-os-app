import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck, BarChart3,
  Bot, Check, CheckCircle2, ChevronRight, CircleDashed, Clock3, FileText,
  Filter, GitBranch, Globe2, Layers3, Mail, Megaphone, MessageSquareText,
  MoreHorizontal, Plus, Search, Send, ShieldCheck, Sparkles, Target,
  TrendingUp, UsersRound, Workflow, X, Zap,
} from "lucide-react";
import { toast } from "sonner";
import type { AppUser } from "@shared/types";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { trpc } from "@/lib/trpc";
import WorkspaceShell from "@/components/bugdata/WorkspaceShell";
import { Button } from "@/components/ui/button";
import GrowthSuitePage from "@/pages/GrowthSuite";

type Snapshot = inferRouterOutputs<AppRouter>["workspace"]["snapshot"];
type Lead = Snapshot["leads"][number];
type Approval = Snapshot["approvals"][number];
type HermesMessage = { role: "user" | "assistant"; content: string; isError?: boolean };
type PageProps = {
  data: Snapshot;
  isLoading: boolean;
  onRefresh: () => void;
  createLead: ReturnType<typeof trpc.workspace.createLead.useMutation>;
  updateLead: ReturnType<typeof trpc.workspace.updateLeadStatus.useMutation>;
  createApproval: ReturnType<typeof trpc.workspace.createApproval.useMutation>;
  decideApproval: ReturnType<typeof trpc.workspace.decideApproval.useMutation>;
  askHermes: ReturnType<typeof trpc.agent.askHermes.useMutation>;
};

const agentRoster = [
  { name: "Hermes", role: "Orchestration", initials: "H", accent: "green", description: "Coordinates work across your business and keeps you in the loop.", status: "READY", icon: GitBranch },
  { name: "Kyla", role: "Sales agent", initials: "K", accent: "blue", description: "Qualifies prospects and helps your team follow up with care.", status: "STANDBY", icon: MessageSquareText },
  { name: "Mira", role: "Marketing agent", initials: "M", accent: "orange", description: "Shapes campaign ideas, content, and audience-growth plans.", status: "STANDBY", icon: Megaphone },
  { name: "Funnel agent", role: "Web & conversion", initials: "F", accent: "violet", description: "Plans landing pages and conversion flows from your brief.", status: "STANDBY", icon: Globe2 },
  { name: "Atlas", role: "Analytics agent", initials: "A", accent: "slate", description: "Finds patterns in your activity and recommends what to do next.", status: "STANDBY", icon: BarChart3 },
];

const moduleDetails: Record<string, { eyebrow: string; title: string; intro: string; icon: typeof Globe2; features: string[]; action: string }> = {
  "/funnels": { eyebrow: "GROWTH SYSTEMS / 01", title: "Your next best page starts with a brief.", intro: "Plan landing pages, websites, forms, and conversion journeys with the Funnel Agent. Publishing and domain connections are not active in this first build.", icon: Globe2, features: ["Prompt-to-page planning", "Lead capture and funnel mapping", "Conversion improvement briefs"], action: "Ask the Funnel Agent" },
  "/marketing": { eyebrow: "GROWTH SYSTEMS / 02", title: "Make every campaign earn its place.", intro: "Bring content ideas, email sequences, social posts, and lead-generation plans into one reviewable workspace. Sending requires connected providers and your approval.", icon: Megaphone, features: ["Campaign planning", "Email and social drafts", "Lead-generation experiments"], action: "Plan a campaign" },
  "/analytics": { eyebrow: "BUSINESS SIGNAL / 03", title: "Turn activity into a clear next move.", intro: "The Analytics Agent is designed to connect pipeline, campaign, and revenue signals. This workspace begins with your own real records—no sample customers or invented metrics.", icon: BarChart3, features: ["Pipeline health", "Campaign performance", "Recommended next actions"], action: "Ask Hermes for an analysis" },
  "/commerce": { eyebrow: "REVENUE SYSTEMS / 04", title: "Build an offer worth saying yes to.", intro: "Map services, digital products, courses, memberships, subscriptions, and affiliate programs as your business grows. No payment processor or checkout is connected yet.", icon: Layers3, features: ["Offers and digital products", "Subscriptions and memberships", "Courses and affiliate programs"], action: "Draft an offer" },
  "/integrations": { eyebrow: "CONNECTED BUSINESS / 05", title: "Your tools should work as one.", intro: "Connect email, WhatsApp, calendars, payment providers, webhooks, and external business services when each integration is configured and secured.", icon: Globe2, features: ["Email and messaging", "Calendars and scheduling", "Payments, webhooks, and external services"], action: "Review connections" },
  "/settings": { eyebrow: "WORKSPACE / SETTINGS", title: "Your business. Your rules.", intro: "Manage your signed-in workspace and keep human oversight at the center of agent execution.", icon: ShieldCheck, features: ["Private Manus account sign-in", "Workspace-scoped CRM records", "Reviewable approval history"], action: "Workspace controls" },
};

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}

function relativeTime(date: Date | string) {
  try { return formatDistanceToNow(new Date(date), { addSuffix: true }); } catch { return "just now"; }
}

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function mutationErrorMessage(error: unknown, fallback: string) {
  const candidate = error as { message?: string; data?: { code?: string } } | null;
  const message = candidate?.message?.trim();
  if (candidate?.data?.code === "UNAUTHORIZED" || /10001|unauthorized|session|token|jwt/i.test(message || "")) {
    return "Your session is not active. Use Sign out, then sign in again before saving changes.";
  }
  return message || fallback;
}

function MetricCard({ label, value, note, icon: Icon, tone = "ink" }: { label: string; value: string | number; note: string; icon: typeof UsersRound; tone?: string }) {
  return <article className="metric-card"><div className="metric-top"><span>{label}</span><span className={`metric-icon metric-${tone}`}><Icon size={16} /></span></div><div className="metric-value">{value}</div><div className="metric-note">{note}</div></article>;
}

function PanelTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return <div className="panel-title"><div>{eyebrow && <div className="panel-eyebrow">{eyebrow}</div>}<h2>{title}</h2></div>{action}</div>;
}

function EmptyState({ icon: Icon, title, description, action }: { icon: typeof UsersRound; title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={20} /></div><h3>{title}</h3><p>{description}</p>{action}</div>;
}

function OverviewPage({ data, isLoading, onRefresh }: Pick<PageProps, "data" | "isLoading" | "onRefresh">) {
  const [, setLocation] = useLocation();
  const firstName = (data.workspace.name?.split(/\s+/)[0] || "there").replace(/[’']s$/i, "");
  const pending = data.approvals.filter(item => item.status === "pending");
  const qualified = data.leads.filter(item => item.status === "qualified" || item.status === "proposal").length;
  const pipelineValue = data.leads.filter(item => item.status !== "lost").reduce((sum, item) => sum + (item.value || 0), 0);
  const nextStep = data.leads.length === 0 ? "Add your first lead" : pending.length ? "Review an agent draft" : "Ask Hermes what to do next";

  return <div className="page-stack">
    <section className="welcome-row">
      <div><div className="eyebrow"><span className="eyebrow-mark">01</span> YOUR BUSINESS, IN MOTION</div><h1>Good to see you, {firstName}.</h1><p className="welcome-subtitle">Here's what needs your attention today.</p></div>
      <button className="primary-action" onClick={() => setLocation("/crm")}><Plus size={16} /> Add a lead <ArrowRight size={15} /></button>
    </section>

    <section className="metric-grid">
      <MetricCard label="TOTAL CONTACTS" value={isLoading ? "—" : data.leads.length} note="In your private CRM" icon={UsersRound} tone="green" />
      <MetricCard label="QUALIFIED PIPELINE" value={isLoading ? "—" : qualified} note="Qualified + proposal stage" icon={Target} tone="blue" />
      <MetricCard label="OPEN APPROVALS" value={isLoading ? "—" : pending.length} note={pending.length ? "Waiting on your call" : "No decisions waiting"} icon={ShieldCheck} tone="amber" />
      <MetricCard label="PIPELINE VALUE" value={isLoading ? "—" : pipelineValue ? `$${pipelineValue.toLocaleString()}` : "$0"} note="From your recorded leads" icon={TrendingUp} tone="violet" />
    </section>

    <section className="dashboard-main-grid">
      <article className="panel pipeline-panel">
        <PanelTitle eyebrow="SALES / LIVE PIPELINE" title="The pipeline" action={<button className="quiet-action" onClick={() => setLocation("/crm")}>Open CRM <ArrowRight size={14} /></button>} />
        {data.leads.length ? <div className="pipeline-overview">
          {(["new", "qualified", "proposal", "won", "lost"] as const).map((stage, index) => {
            const count = data.leads.filter(item => item.status === stage).length;
            const width = Math.max(4, (count / data.leads.length) * 100);
            return <div className="pipeline-stage" key={stage}><div className="pipeline-stage-heading"><span className={`stage-index stage-${stage}`}>0{index + 1}</span><span>{statusLabel(stage)}</span><strong>{count}</strong></div><div className="pipeline-track"><span className={`pipeline-fill stage-fill-${stage}`} style={{ width: `${width}%` }} /></div></div>;
          })}
          <div className="pipeline-footnote"><span><span className="status-pip" /> Based on {data.leads.length} CRM {data.leads.length === 1 ? "record" : "records"}</span><span>Updated just now</span></div>
        </div> : <EmptyState icon={GitBranch} title="Your pipeline starts here" description="Add a lead and BUGDATA will give you a clear place to move the conversation forward." action={<button className="text-action" onClick={() => setLocation("/crm")}>Open your CRM <ArrowRight size={14} /></button>} />}
      </article>

      <article className="panel attention-panel">
        <PanelTitle eyebrow="HUMAN IN THE LOOP" title="Needs your attention" />
        {pending.length ? <div className="attention-list">{pending.slice(0, 3).map(item => <button className="attention-item" key={item.id} onClick={() => setLocation("/approvals")}><span className="attention-icon"><ShieldCheck size={17} /></span><span className="attention-copy"><strong>{item.title}</strong><small>{item.agent} · {relativeTime(item.createdAt)}</small></span><ChevronRight size={15} /></button>)}</div> : <div className="clear-state"><span className="clear-check"><Check size={17} /></span><strong>You're all caught up.</strong><span>Drafts needing approval will show here.</span></div>}
        <div className="attention-next"><div className="attention-next-icon"><Zap size={16} /></div><div><small>NEXT STEP</small><strong>{nextStep}</strong></div><button aria-label="Open next step" onClick={() => setLocation(data.leads.length === 0 ? "/crm" : pending.length ? "/approvals" : "/agents")}><ArrowRight size={15} /></button></div>
      </article>
    </section>

    <section className="dashboard-lower-grid">
      <article className="panel agent-presence-panel">
        <PanelTitle eyebrow="AGENT NETWORK" title="Your team, on standby" action={<button className="quiet-action" onClick={() => setLocation("/agents")}>Meet your agents <ArrowRight size={14} /></button>} />
        <div className="agent-presence-list">{agentRoster.slice(0, 4).map((agent, index) => { const Icon = agent.icon; return <div className="agent-presence" key={agent.name}><span className={`agent-avatar agent-${agent.accent}`}><Icon size={15} /></span><span className="agent-presence-name"><strong>{agent.name}</strong><small>{agent.role}</small></span><span className={`agent-state ${index === 0 ? "agent-state-ready" : ""}`}><i />{index === 0 ? "READY" : "STANDBY"}</span></div>; })}</div>
      </article>
      <article className="panel activity-panel">
        <PanelTitle eyebrow="RUN LOG" title="Recent activity" action={<button className="icon-button panel-more" aria-label="More activity"><MoreHorizontal size={18} /></button>} />
        {data.activities.length ? <div className="activity-list">{data.activities.slice(0, 5).map(item => <div className="activity-row" key={item.id}><span className="activity-dot" /><div><p>{item.description}</p><small>{item.actor} · {relativeTime(item.createdAt)}</small></div></div>)}</div> : <div className="activity-empty"><CircleDashed size={18} /><span>Activity appears here as your business moves.</span></div>}
      </article>
    </section>

    <section className="setup-strip"><div className="setup-stamp"><Sparkles size={16} /></div><div className="setup-copy"><strong>Your command center is ready.</strong><span>Start with a lead or ask Hermes to help map your next move. Your workspace only shows records you add.</span></div><button className="setup-action" onClick={() => setLocation("/agents")}>Meet Hermes <ArrowRight size={14} /></button></section>
  </div>;
}

function CRMPage({ data, onRefresh, createLead, updateLead }: Pick<PageProps, "data" | "onRefresh" | "createLead" | "updateLead">) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", title: "", source: "Manual entry" });
  const filtered = useMemo(() => data.leads.filter(lead => {
    const match = `${lead.name} ${lead.email} ${lead.company ?? ""} ${lead.title ?? ""}`.toLowerCase().includes(search.toLowerCase());
    return match && (statusFilter === "all" || lead.status === statusFilter);
  }), [data.leads, search, statusFilter]);
  const selected = data.leads.find(item => item.id === selectedId) ?? null;

  function submitLead(event: FormEvent) {
    event.preventDefault();
    createLead.mutate(form, { onSuccess: () => { setShowNew(false); setForm({ name: "", email: "", company: "", title: "", source: "Manual entry" }); toast.success("Lead added to your CRM"); onRefresh(); }, onError: error => toast.error(mutationErrorMessage(error, "Lead could not be saved.")) });
  }

  return <div className="page-stack">
    <section className="module-heading"><div><div className="eyebrow"><span className="eyebrow-mark">02</span> CUSTOMER RELATIONSHIPS</div><h1>CRM & pipeline</h1><p>One place for the people, conversations, and next steps that move your business.</p></div><button className="primary-action" onClick={() => setShowNew(true)}><Plus size={16} /> Add a lead</button></section>
    <div className="crm-summary-strip"><span><UsersRound size={16} /><strong>{data.leads.length}</strong> contacts</span><span><Target size={16} /><strong>{data.leads.filter(item => ["qualified", "proposal"].includes(item.status)).length}</strong> qualified</span><span><Clock3 size={16} /><strong>{data.leads.filter(item => item.status === "new").length}</strong> to follow up</span><span className="crm-private-note"><ShieldCheck size={15} /> Private to your workspace</span></div>
    <section className="panel crm-panel">
      <div className="crm-toolbar"><div className="crm-search"><Search size={16} /><input aria-label="Search contacts" placeholder="Search name, company, or email…" value={search} onChange={event => setSearch(event.target.value)} /><kbd>⌘ F</kbd></div><label className="filter-select"><Filter size={15} /><select aria-label="Filter by stage" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">All stages</option><option value="new">New</option><option value="qualified">Qualified</option><option value="proposal">Proposal</option><option value="won">Won</option><option value="lost">Lost</option></select></label></div>
      {filtered.length ? <div className="table-scroll"><table className="lead-table"><thead><tr><th>CONTACT</th><th>COMPANY</th><th>STAGE</th><th>SOURCE</th><th>ADDED</th><th /></tr></thead><tbody>{filtered.map(lead => <tr key={lead.id} className={selectedId === lead.id ? "selected-row" : ""} onClick={() => setSelectedId(selectedId === lead.id ? null : lead.id)}><td><div className="contact-cell"><span className="contact-avatar">{initials(lead.name)}</span><span><strong>{lead.name}</strong><small>{lead.email}</small></span></div></td><td>{lead.company || <span className="muted-dash">—</span>}{lead.title && <small className="company-role">{lead.title}</small>}</td><td><span className={`stage-pill stage-pill-${lead.status}`}><i />{statusLabel(lead.status)}</span></td><td>{lead.source || "—"}</td><td>{relativeTime(lead.createdAt)}</td><td><button className="icon-button row-more" aria-label={`Open ${lead.name}`} onClick={event => { event.stopPropagation(); setSelectedId(lead.id); }}><ChevronRight size={16} /></button></td></tr>)}</tbody></table></div> : <EmptyState icon={UsersRound} title={search || statusFilter !== "all" ? "No contacts match that search" : "Your CRM is ready for its first lead"} description={search || statusFilter !== "all" ? "Try a different name or stage filter." : "Add a real contact to start a pipeline. BUGDATA does not preload pretend customers."} action={!search && statusFilter === "all" ? <button className="primary-action primary-action-small" onClick={() => setShowNew(true)}><Plus size={15} /> Add your first lead</button> : undefined} />}
    </section>
    {selected && <aside className="detail-card"><div className="detail-card-head"><div><span className="panel-eyebrow">CONTACT RECORD / #{selected.id}</span><button className="icon-button" onClick={() => setSelectedId(null)} aria-label="Close contact"><X size={17} /></button></div><div className="detail-person"><span className="contact-avatar contact-avatar-large">{initials(selected.name)}</span><div><h2>{selected.name}</h2><span>{selected.title || "Contact"}{selected.company ? ` at ${selected.company}` : ""}</span></div></div></div><div className="detail-fields"><div><small>EMAIL</small><strong>{selected.email}</strong></div><div><small>LEAD SOURCE</small><strong>{selected.source || "Not recorded"}</strong></div><div><small>PIPELINE STAGE</small><select className="detail-stage-select" value={selected.status} onChange={event => updateLead.mutate({ id: selected.id, status: event.target.value as Lead["status"] }, { onSuccess: () => { toast.success("Lead stage updated"); onRefresh(); }, onError: error => toast.error(error.message) })}><option value="new">New</option><option value="qualified">Qualified</option><option value="proposal">Proposal</option><option value="won">Won</option><option value="lost">Lost</option></select></div><div><small>ADDED</small><strong>{new Date(selected.createdAt).toLocaleDateString()}</strong></div></div><div className="detail-footer"><MessageSquareText size={15} /> Conversations and automated follow-ups will appear as those capabilities are connected.</div></aside>}

    {showNew && <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setShowNew(false); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="lead-modal-title"><div className="modal-heading"><div><span className="panel-eyebrow">CRM / NEW RECORD</span><h2 id="lead-modal-title">Add a lead</h2></div><button className="icon-button" onClick={() => setShowNew(false)} aria-label="Close"><X size={18} /></button></div><p className="modal-intro">Add a real person to your workspace. This record stays private to your account.</p><form onSubmit={submitLead} className="lead-form"><label>Full name<input autoFocus required maxLength={160} placeholder="e.g. Jordan Lee" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label><label>Work email<input type="email" required maxLength={320} placeholder="jordan@company.com" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></label><div className="form-row"><label>Company<input maxLength={160} placeholder="Company" value={form.company} onChange={event => setForm({ ...form, company: event.target.value })} /></label><label>Role<input maxLength={160} placeholder="Role or title" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /></label></div><label>Source<input maxLength={100} value={form.source} onChange={event => setForm({ ...form, source: event.target.value })} /></label><div className="modal-actions"><button type="button" className="secondary-action" onClick={() => setShowNew(false)}>Cancel</button><button className="primary-action" type="submit" disabled={createLead.isPending}>{createLead.isPending ? "Saving…" : <><Plus size={15} /> Save lead</>}</button></div></form></section></div>}
  </div>;
}

function HermesPanel({ askHermes, createApproval }: Pick<PageProps, "askHermes" | "createApproval">) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<HermesMessage[]>([{ role: "assistant", content: "I’m Hermes, your orchestration agent. I can help you think through sales, marketing, and day-to-day operations. I can draft the next move; you stay in charge of anything that changes your business." }]);
  const suggestions = ["How should I follow up with a new lead?", "Help me plan a simple lead-generation campaign.", "What should I set up first in my workspace?"];
  async function sendMessage(value = prompt) {
    const text = value.trim();
    if (!text || askHermes.isPending) return;
    setPrompt("");
    setMessages(current => [...current, { role: "user", content: text }]);
    try {
      const result = await askHermes.mutateAsync({ prompt: text });
      setMessages(current => [...current, { role: "assistant", content: result.reply }]);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Hermes couldn't complete that request.";
      setMessages(current => [...current, { role: "assistant", content: detail, isError: true }]);
    }
  }
  const lastReply = [...messages].reverse().find(message => message.role === "assistant" && !message.isError)?.content;
  function saveDraft() {
    if (!lastReply) return;
    createApproval.mutate({ title: "Hermes draft for review", description: lastReply, agent: "Hermes" }, { onSuccess: () => toast.success("Draft added to your approval queue"), onError: error => toast.error(error.message) });
  }
  return <article className="panel hermes-panel">
    <div className="hermes-header"><span className="hermes-orb"><Sparkles size={18} /></span><div><div className="hermes-title-line"><h2>Talk to Hermes</h2><span className="agent-state agent-state-ready"><i /> READY</span></div><p>Your orchestration agent · Built-in AI</p></div><span className="hermes-header-mark">H / 01</span></div>
    <div className="hermes-safety"><ShieldCheck size={15} /><span>Hermes can reason and draft. It cannot send, spend, or make changes without an explicit review step.</span></div>
    <div className="chat-log" aria-live="polite">{messages.map((message, index) => <div className={`chat-message chat-${message.role} ${message.isError ? "chat-error" : ""}`} key={`${index}-${message.role}`}><span className={`chat-avatar ${message.role === "assistant" ? "chat-avatar-agent" : ""}`}>{message.role === "assistant" ? <Sparkles size={13} /> : "Y"}</span><div><small>{message.role === "assistant" ? "HERMES" : "YOU"}</small><p>{message.content}</p></div></div>)}{askHermes.isPending && <div className="chat-message chat-assistant"><span className="chat-avatar chat-avatar-agent"><Sparkles size={13} /></span><div><small>HERMES</small><p className="thinking-dots"><i /><i /><i /></p></div></div>}</div>
    <form className="command-composer" onSubmit={event => { event.preventDefault(); void sendMessage(); }}><textarea aria-label="Ask Hermes" placeholder="Tell Hermes what you're working on…" rows={2} maxLength={1600} value={prompt} onChange={event => setPrompt(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} /><div className="composer-footer"><span>Enter to send · Shift + Enter for a new line</span><button type="submit" aria-label="Send to Hermes" disabled={!prompt.trim() || askHermes.isPending}><Send size={16} /></button></div></form>
    {!messages.some(message => message.role === "user") && <div className="suggestion-list">{suggestions.map(item => <button key={item} onClick={() => void sendMessage(item)}>{item}<ArrowRight size={13} /></button>)}</div>}
    {messages.some(message => message.role === "user") && lastReply && <div className="draft-action"><span><ShieldCheck size={14} /> Make a review item from this draft?</span><button onClick={saveDraft} disabled={createApproval.isPending}>{createApproval.isPending ? "Saving…" : "Add to approvals"}</button></div>}
  </article>;
}

function AgentsPage({ askHermes, createApproval }: Pick<PageProps, "askHermes" | "createApproval">) {
  return <div className="page-stack"><section className="module-heading"><div><div className="eyebrow"><span className="eyebrow-mark">03</span> AGENT NETWORK / HERMES</div><h1>Meet your team.</h1><p>Specialists coordinated around your goals—not five more chat windows.</p></div><span className="platform-status"><span className="status-pip" /> PLATFORM AI AVAILABLE</span></section>
    <section className="agent-roster-grid">{agentRoster.map((agent, index) => { const Icon = agent.icon; return <article className={`agent-card ${index === 0 ? "agent-card-featured" : ""}`} key={agent.name}><div className="agent-card-top"><span className={`agent-avatar agent-avatar-large agent-${agent.accent}`}><Icon size={18} /></span><span className={`agent-state ${index === 0 ? "agent-state-ready" : ""}`}><i />{agent.status}</span></div><span className="agent-role">{agent.role.toUpperCase()}</span><h2>{agent.name}</h2><p>{agent.description}</p><div className="agent-card-footer"><span>{index === 0 ? "COMMAND / COORDINATE" : "SPECIALIST / ON REQUEST"}</span>{index === 0 && <Sparkles size={15} />}</div></article>; })}</section>
    <HermesPanel askHermes={askHermes} createApproval={createApproval} />
  </div>;
}

function ApprovalsPage({ data, decideApproval }: Pick<PageProps, "data" | "decideApproval">) {
  const pending = data.approvals.filter(item => item.status === "pending");
  const resolved = data.approvals.filter(item => item.status !== "pending");
  return <div className="page-stack"><section className="module-heading"><div><div className="eyebrow"><span className="eyebrow-mark">04</span> HUMAN CONTROL</div><h1>Nothing moves without you.</h1><p>Review the work your agents have prepared. Approvals are recorded; they do not currently send or execute external actions.</p></div><span className="approval-counter"><strong>{pending.length.toString().padStart(2, "0")}</strong><small>AWAITING YOU</small></span></section>
    <div className="approval-policy-banner"><ShieldCheck size={18} /><div><strong>You stay in the loop.</strong><span>Approving or rejecting below updates the review record only. External sending, purchases, and live workflow execution are not connected.</span></div></div>
    <section className="panel approvals-panel"><PanelTitle eyebrow="REVIEW QUEUE" title={`Pending review · ${pending.length}`} />{pending.length ? <div className="approval-list">{pending.map(item => <ApprovalCard item={item} key={item.id} onDecision={status => decideApproval.mutate({ id: item.id, status }, { onSuccess: () => toast.success(status === "approved" ? "Review approved" : "Review rejected"), onError: error => toast.error(error.message) })} busy={decideApproval.isPending} />)}</div> : <EmptyState icon={BadgeCheck} title="Clear runway." description="No agent drafts are waiting for your review. If Hermes drafts something consequential, it can be sent here for a decision." />}</section>
    {resolved.length > 0 && <section className="panel resolved-panel"><PanelTitle eyebrow="DECISION LOG" title="Recently reviewed" />{resolved.slice(0, 8).map(item => <div className="resolved-row" key={item.id}><span className={`resolved-icon ${item.status}`}><Check size={14} /></span><span><strong>{item.title}</strong><small>{item.agent} · {relativeTime(item.updatedAt)}</small></span><span className={`resolved-state resolved-${item.status}`}>{item.status}</span></div>)}</section>}
  </div>;
}

function ApprovalCard({ item, onDecision, busy }: { item: Approval; onDecision: (status: "approved" | "rejected") => void; busy: boolean }) {
  return <article className="approval-card"><div className="approval-card-top"><span className="approval-type"><Sparkles size={14} /> {item.agent.toUpperCase()} / DRAFT FOR REVIEW</span><span className="approval-time"><Clock3 size={13} /> {relativeTime(item.createdAt)}</span></div><h3>{item.title}</h3><p>{item.description}</p><div className="approval-card-bottom"><span><ShieldCheck size={14} /> Review record only · no external action</span><div><button className="reject-button" onClick={() => onDecision("rejected")} disabled={busy}>Reject</button><button className="approve-button" onClick={() => onDecision("approved")} disabled={busy}><Check size={15} /> Approve</button></div></div></article>;
}

function WorkflowsPage({ data, askHermes }: Pick<PageProps, "data" | "askHermes">) {
  const [, setLocation] = useLocation();
  const templates = [
    { icon: UsersRound, title: "New lead follow-up", trigger: "When a new lead is added", action: "Draft a personalized first-touch message", tag: "SALES" },
    { icon: Mail, title: "Quiet pipeline nudge", trigger: "When a lead has no activity for 7 days", action: "Prepare a follow-up suggestion for review", tag: "FOLLOW-UP" },
    { icon: Megaphone, title: "Campaign launch review", trigger: "Before a campaign is sent", action: "Summarize audience, timing, and message for approval", tag: "MARKETING" },
  ];
  return <div className="page-stack"><section className="module-heading"><div><div className="eyebrow"><span className="eyebrow-mark">05</span> AUTOMATION / HUMAN APPROVAL</div><h1>Good systems do the busywork.</h1><p>Set up the repeatable work. Keep the judgment calls with you.</p></div><span className="module-state-pill">BUILDER IN PROGRESS</span></section>
    <div className="workflow-zero-state"><div className="workflow-zero-icon"><Workflow size={22} /></div><div><span className="panel-eyebrow">YOUR WORKFLOW ENGINE</span><h2>{data.leads.length ? "Your business is ready for repeatable work." : "First, give the workflow a business to run."}</h2><p>This first build does not run workflows in the background. Start with one of these governed workflow designs; Hermes can help draft the steps.</p><button className="text-action" onClick={() => setLocation("/agents")}>Open Hermes command <ArrowRight size={14} /></button></div></div>
    <div className="template-grid">{templates.map(template => { const Icon = template.icon; return <article className="workflow-template" key={template.title}><div className="template-top"><span className="template-icon"><Icon size={17} /></span><span className="template-tag">{template.tag}</span></div><h3>{template.title}</h3><div className="workflow-step"><small>TRIGGER</small><span>{template.trigger}</span></div><div className="workflow-connector"><span /></div><div className="workflow-step"><small>AGENT ACTION</small><span>{template.action}</span></div><button className="template-action" onClick={() => setLocation("/agents")}>Draft with Hermes <ArrowRight size={14} /></button></article>; })}</div>
    <div className="workflow-footnote"><ShieldCheck size={15} /> No template is active until you configure its triggers, permissions, connected tools, and approval policy.</div>
  </div>;
}

function ExpansionPage({ path, data, askHermes }: { path: string } & Pick<PageProps, "data" | "askHermes">) {
  const [, setLocation] = useLocation();
  const detail = moduleDetails[path] ?? moduleDetails["/funnels"];
  const Icon = detail.icon;
  const actions = {
    "/funnels": "Plan the first page and conversion path for my business.",
    "/marketing": "Help me draft a simple campaign plan for a small business.",
    "/analytics": `Review my business setup. I have ${data.leads.length} CRM leads and ${data.approvals.filter(item => item.status === "pending").length} pending approvals. What should I focus on next?`,
    "/commerce": "Help me outline a clear offer for a digital product or service.",
  "/settings": "Summarize the human approval and data privacy rules for my workspace.",
  "/integrations": "Help me prioritize the first integrations a small business workspace needs.",
  }[path] ?? detail.action;
  return <div className="page-stack"><section className="module-heading"><div><div className="eyebrow"><span className="eyebrow-mark">OS</span> {detail.eyebrow}</div><h1>{detail.title}</h1><p>{detail.intro}</p></div><span className="module-state-pill">{path === "/settings" ? "WORKSPACE ACTIVE" : "MODULE PREVIEW"}</span></section>
    <section className="expansion-hero"><div className="expansion-art"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="expansion-icon"><Icon size={30} /></div><span className="orbit-label orbit-label-one">YOUR GOAL</span><span className="orbit-label orbit-label-two">AGENT PLAN</span><span className="orbit-label orbit-label-three">HUMAN REVIEW</span></div><div className="expansion-copy"><span className="panel-eyebrow">BUILT TO WORK TOGETHER</span><h2>A connected OS, one capability at a time.</h2><p>These next-step capabilities are part of the BUGDATA roadmap. This screen makes the direction visible while the core command, CRM, and approval loop is built first.</p><button className="primary-action" onClick={() => setLocation(path === "/settings" ? "/" : "/agents")}><Sparkles size={15} /> {path === "/settings" ? "Back to command center" : "Ask Hermes to help"} <ArrowRight size={15} /></button></div></section>
    {path === "/settings" ? <section className="panel settings-panel"><PanelTitle eyebrow="ACCOUNT & DATA" title="Workspace settings" /><div className="settings-line"><span>Workspace identity</span><strong>{data.workspace.name}</strong></div><div className="settings-line"><span>Business records</span><strong>Private to your signed-in account</strong></div><div className="settings-line"><span>External integrations</span><strong>None connected yet</strong></div><div className="settings-line"><span>Agent permission mode</span><strong>Draft first · human review</strong></div></section> : <section className="expansion-capabilities">{detail.features.map((feature, index) => <article key={feature}><span>0{index + 1}</span><h3>{feature}</h3><small>{index === 0 ? "FOUNDATION" : "ON THE ROADMAP"}</small></article>)}</section>}
    <div className="roadmap-callout"><span className="roadmap-dot" /><p><strong>Honest status:</strong> {path === "/settings" ? "This is the current account-level workspace shell." : "This module is a roadmap preview, not a claim that its production builder, sending, checkout, or external connections are live."}</p></div>
  </div>;
}

export default function Home({ user, onLogout }: { user: AppUser; onLogout: () => void | Promise<void> }) {
  const [location] = useLocation();
  const staticPages = typeof window !== "undefined" && window.location.hostname.endsWith("github.io");
  const snapshot = trpc.workspace.snapshot.useQuery(undefined, { retry: false, enabled: !staticPages });
  const utils = trpc.useUtils();
  const onRefresh = () => { void utils.workspace.snapshot.invalidate(); };
  const createLead = trpc.workspace.createLead.useMutation({ onSuccess: onRefresh });
  const updateLead = trpc.workspace.updateLeadStatus.useMutation({ onSuccess: onRefresh });
  const createApproval = trpc.workspace.createApproval.useMutation({ onSuccess: onRefresh });
  const decideApproval = trpc.workspace.decideApproval.useMutation({ onSuccess: onRefresh });
  const askHermes = trpc.agent.askHermes.useMutation();
  const data = snapshot.data ?? (staticPages ? {
    workspace: { id: "static", owner_id: user.id, name: `${user.name || "Your"}'s workspace`, slug: "static", plan: "free", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    leads: [], approvals: [], activities: [],
  } as Snapshot : undefined);
  const displayName = user.name?.trim() || user.email?.split("@")[0] || "Workspace owner";
  const pendingCount = data?.approvals.filter(item => item.status === "pending").length ?? 0;

  if (snapshot.isLoading && !data) return <div className="loading-workspace"><div className="loading-mark"><Sparkles size={19} /></div><span>Preparing your private workspace…</span><div className="loading-line" /></div>;
  if (!data) return <div className="loading-workspace load-error"><div className="loading-mark"><X size={18} /></div><strong>We couldn't open your workspace.</strong><span>{snapshot.error?.message || "Check your connection and try again."}</span><Button onClick={() => void snapshot.refetch()}>Try again</Button></div>;

  const props: PageProps = { data, isLoading: snapshot.isLoading, onRefresh, createLead, updateLead, createApproval, decideApproval, askHermes };
  let content: ReactNode;
  switch (location) {
    case "/": content = <OverviewPage data={data} isLoading={snapshot.isLoading} onRefresh={onRefresh} />; break;
    case "/crm": content = <CRMPage data={data} onRefresh={onRefresh} createLead={createLead} updateLead={updateLead} />; break;
    case "/agents": content = <AgentsPage askHermes={askHermes} createApproval={createApproval} />; break;
    case "/approvals": content = <ApprovalsPage data={data} decideApproval={decideApproval} />; break;
    case "/workflows": content = <WorkflowsPage data={data} askHermes={askHermes} />; break;
    case "/funnels": case "/marketing": case "/automations": case "/analytics": case "/commerce": case "/courses": case "/bookings": case "/affiliates": content = <GrowthSuitePage path={location} data={data} />; break;
    case "/integrations": case "/settings": content = <ExpansionPage path={location} data={data} askHermes={askHermes} />; break;
    default: content = <OverviewPage data={data} isLoading={snapshot.isLoading} onRefresh={onRefresh} />;
  }
  void props;

  return <WorkspaceShell displayName={displayName} leadCount={data.leads.length} pendingCount={pendingCount} onLogout={() => { void onLogout(); }}>{content}</WorkspaceShell>;
}
