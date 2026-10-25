import { useState, type ReactNode } from "react";
import {
  ArrowRight, BarChart3, CalendarDays, Check, ChevronRight, Clock3,
  Copy, CreditCard, ExternalLink, Filter, GraduationCap, Handshake,
  Layers3, Mail, Megaphone, MoreHorizontal, Play, Plus, RefreshCw,
  Send, ShoppingBag, Sparkles, Tag, Target, UsersRound, Workflow,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { trpc } from "@/lib/trpc";

type Snapshot = inferRouterOutputs<AppRouter>["workspace"]["snapshot"];
type SuitePath = "/funnels" | "/marketing" | "/automations" | "/commerce" | "/courses" | "/bookings" | "/affiliates" | "/analytics";

type SuiteProps = { path: string; data: Snapshot };

type IconType = typeof Mail;

const metricsByPath: Record<SuitePath, { label: string; value: string; note: string; tone: string; icon: IconType }[]> = {
  "/funnels": [
    { label: "ACTIVE FUNNELS", value: "04", note: "2 drafts · 2 live previews", tone: "green", icon: Layers3 },
    { label: "FUNNEL VISITORS", value: "2,418", note: "+18.4% this month", tone: "blue", icon: UsersRound },
    { label: "OPT-IN RATE", value: "24.8%", note: "+3.2 pts from last week", tone: "amber", icon: Target },
    { label: "SALES", value: "$8,640", note: "Illustrative demo revenue", tone: "violet", icon: CreditCard },
  ],
  "/marketing": [
    { label: "CONTACTS", value: "1,284", note: "Across 6 segments", tone: "green", icon: UsersRound },
    { label: "EMAILS SENT", value: "18.4k", note: "Unlimited sends in demo", tone: "blue", icon: Send },
    { label: "OPEN RATE", value: "42.6%", note: "+6.1% against benchmark", tone: "amber", icon: Mail },
    { label: "CAMPAIGNS", value: "07", note: "3 ready for review", tone: "violet", icon: Megaphone },
  ],
  "/automations": [
    { label: "ACTIVE FLOWS", value: "06", note: "2 need a trigger", tone: "green", icon: Workflow },
    { label: "CONTACTS MOVING", value: "312", note: "Through active journeys", tone: "blue", icon: RefreshCw },
    { label: "ACTIONS RUN", value: "1,946", note: "This month in preview", tone: "amber", icon: Zap },
    { label: "TIME SAVED", value: "18h", note: "Estimated operator time", tone: "violet", icon: Clock3 },
  ],
  "/commerce": [
    { label: "ACTIVE OFFERS", value: "08", note: "Digital + service offers", tone: "green", icon: ShoppingBag },
    { label: "CHECKOUTS", value: "146", note: "Demo orders this month", tone: "blue", icon: CreditCard },
    { label: "CONVERSION", value: "6.8%", note: "+1.4 pts from last month", tone: "amber", icon: Target },
    { label: "AOV", value: "$74", note: "With upsell preview", tone: "violet", icon: BarChart3 },
  ],
  "/courses": [
    { label: "COURSES", value: "03", note: "1 published · 2 in draft", tone: "green", icon: GraduationCap },
    { label: "STUDENTS", value: "248", note: "Across all memberships", tone: "blue", icon: UsersRound },
    { label: "COMPLETION", value: "68%", note: "+8% over last cohort", tone: "amber", icon: Check },
    { label: "LESSONS", value: "42", note: "Video, PDF, and text", tone: "violet", icon: Layers3 },
  ],
  "/bookings": [
    { label: "UPCOMING", value: "12", note: "Across 3 event types", tone: "green", icon: CalendarDays },
    { label: "OPEN SLOTS", value: "28", note: "Next 14 days", tone: "blue", icon: Clock3 },
    { label: "SHOW RATE", value: "91%", note: "Confirmation flow active", tone: "amber", icon: Check },
    { label: "DEPOSITS", value: "$1,240", note: "Illustrative bookings", tone: "violet", icon: CreditCard },
  ],
  "/affiliates": [
    { label: "PARTNERS", value: "18", note: "6 awaiting approval", tone: "green", icon: Handshake },
    { label: "CLICKS", value: "4,821", note: "+22% this month", tone: "blue", icon: ExternalLink },
    { label: "CONVERSION", value: "8.2%", note: "Partner traffic", tone: "amber", icon: Target },
    { label: "COMMISSIONS", value: "$2,180", note: "Pending payout preview", tone: "violet", icon: CreditCard },
  ],
  "/analytics": [
    { label: "VISITORS", value: "8,412", note: "+18.4% this month", tone: "green", icon: UsersRound },
    { label: "LEADS", value: "1,284", note: "15.3% visitor-to-lead", tone: "blue", icon: Target },
    { label: "CUSTOMERS", value: "86", note: "6.7% lead-to-customer", tone: "amber", icon: Check },
    { label: "REVENUE", value: "$12.6k", note: "Illustrative demo data", tone: "violet", icon: BarChart3 },
  ],
};

const pageCopy: Record<SuitePath, { eyebrow: string; title: string; intro: string; action: string }> = {
  "/funnels": { eyebrow: "GROWTH / FUNNELS", title: "Build the path from first click to yes.", intro: "Design landing pages, opt-in flows, checkout steps, and post-purchase journeys in one reviewable workspace.", action: "Create funnel" },
  "/marketing": { eyebrow: "GROWTH / EMAIL STUDIO", title: "Send the right message at the right moment.", intro: "Plan broadcasts, campaigns, newsletters, and segmented follow-ups without losing the context behind each contact.", action: "Draft campaign" },
  "/automations": { eyebrow: "OPERATIONS / AUTOMATION", title: "Let the repeatable work run itself.", intro: "Connect triggers, conditions, delays, tags, emails, course access, and approvals in a visual customer journey.", action: "Create workflow" },
  "/commerce": { eyebrow: "REVENUE / OFFERS", title: "Turn a clear offer into a clean checkout.", intro: "Manage products, subscriptions, coupons, order bumps, upsells, and payment-ready checkout experiences.", action: "Create offer" },
  "/courses": { eyebrow: "EDUCATION / MEMBERSHIPS", title: "Give your knowledge a place to grow.", intro: "Structure courses, lessons, downloads, cohorts, and gated memberships with a clear student experience.", action: "Create course" },
  "/bookings": { eyebrow: "OPERATIONS / BOOKINGS", title: "Make it easy for the right people to meet you.", intro: "Publish availability, collect booking details, send confirmations, and keep your calendar connected to the customer journey.", action: "Add event type" },
  "/affiliates": { eyebrow: "GROWTH / PARTNERS", title: "Let trusted people extend your reach.", intro: "Recruit partners, issue links, track referrals, and keep commission decisions visible before a payout is made.", action: "Invite partner" },
  "/analytics": { eyebrow: "SIGNALS / ANALYTICS", title: "Know what is moving before you decide what to do.", intro: "See the relationship between traffic, contacts, campaigns, funnels, offers, and revenue in one operating view.", action: "Create report" },
};

function MetricStrip({ path }: { path: SuitePath }) {
  return <div className="suite-metrics">{metricsByPath[path].map(metric => { const Icon = metric.icon; return <article className="metric-card" key={metric.label}><div className="metric-top"><span>{metric.label}</span><span className={`metric-icon metric-${metric.tone}`}><Icon size={16} /></span></div><div className="metric-value">{metric.value}</div><div className="metric-note">{metric.note}</div></article>; })}</div>;
}

function SuiteHeader({ path, onAction }: { path: SuitePath; onAction: () => void }) {
  const copy = pageCopy[path];
  return <section className="module-heading suite-heading"><div><div className="eyebrow"><span className="eyebrow-mark">OS</span> {copy.eyebrow}</div><h1>{copy.title}</h1><p>{copy.intro}</p></div><button className="primary-action" onClick={onAction}><Plus size={16} /> {copy.action} <ArrowRight size={15} /></button></section>;
}

function DemoNotice() {
  return <div className="suite-demo-notice"><Sparkles size={15} /><span><strong>Design preview.</strong> Create funnel opens the editor preview; saving, publishing, domains, and live conversion data are not connected yet.</span><span className="suite-demo-status"><i /> DESIGN MODE</span></div>;
}

function SectionHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return <div className="panel-title suite-section-heading"><div><div className="panel-eyebrow">{eyebrow}</div><h2>{title}</h2></div>{action}</div>;
}

function FunnelSuite() {
  const [selected, setSelected] = useState("Lead magnet / Owner OS");
  const funnels = [
    { name: "Lead magnet / Owner OS", status: "LIVE PREVIEW", visitors: "1,208", leads: "318", conversion: "26.3%", steps: ["Opt-in page", "Thank-you", "Welcome email"] },
    { name: "Course launch / Foundations", status: "DRAFT", visitors: "842", leads: "184", conversion: "21.8%", steps: ["Sales page", "Checkout", "Course access"] },
    { name: "Consulting / Strategy call", status: "NEEDS REVIEW", visitors: "368", leads: "74", conversion: "20.1%", steps: ["Landing page", "Booking", "Confirmation"] },
  ];
  const funnel = funnels.find(item => item.name === selected) ?? funnels[0];
  return <><section className="panel suite-panel"><SectionHeading eyebrow="FUNNEL LIBRARY" title="Your customer journeys" action={<button className="quiet-action"><Filter size={14} /> Filter</button>} /><div className="suite-funnel-list">{funnels.map(item => <button className={`suite-funnel-row ${item.name === selected ? "selected" : ""}`} key={item.name} onClick={() => setSelected(item.name)}><span className="suite-row-icon"><Layers3 size={16} /></span><span className="suite-row-main"><strong>{item.name}</strong><small>{item.steps.length} steps · Updated today</small></span><span className={`suite-status ${item.status === "LIVE PREVIEW" ? "suite-status-live" : item.status === "NEEDS REVIEW" ? "suite-status-warn" : ""}`}>{item.status}</span><span className="suite-row-number">{item.conversion}</span><ChevronRight size={15} /></button>)}</div></section><section className="suite-two-col"><article className="panel suite-panel"><SectionHeading eyebrow="FUNNEL MAP" title={funnel.name} action={<button className="icon-button" aria-label="More funnel options"><MoreHorizontal size={18} /></button>} /><div className="funnel-canvas">{funnel.steps.map((step, index) => <div className="funnel-step-wrap" key={step}><div className="funnel-step"><span className="funnel-step-index">0{index + 1}</span><div><strong>{step}</strong><small>{index === 0 ? "Entry point" : index === funnel.steps.length - 1 ? "Next action" : "Conversion step"}</small></div><ChevronRight size={15} /></div>{index < funnel.steps.length - 1 && <div className="funnel-connector"><span /></div>}</div>)}</div><div className="suite-footnote"><span><Play size={13} /> Preview journey</span><span>Draft changes require publish review</span></div></article><article className="panel suite-panel"><SectionHeading eyebrow="CONVERSION SNAPSHOT" title="What is working" /><div className="conversion-bars"><div><span><strong>Visitors</strong><b>{funnel.visitors}</b></span><i style={{ width: "100%" }} /></div><div><span><strong>Leads</strong><b>{funnel.leads}</b></span><i className="bar-blue" style={{ width: "46%" }} /></div><div><span><strong>Conversion</strong><b>{funnel.conversion}</b></span><i className="bar-amber" style={{ width: "26%" }} /></div></div><div className="suite-callout"><Target size={16} /><span><strong>Hermes suggestion</strong> Add a short proof block before the opt-in form to test a clearer trust signal.</span></div></article></section></>;
}

function MarketingSuite() {
  const [channel, setChannel] = useState("All content");
  const campaigns = [
    { name: "Welcome to the operating system", type: "EMAIL SEQUENCE", status: "READY FOR REVIEW", audience: "New leads", open: "48.2%", click: "12.8%" },
    { name: "Foundations course launch", type: "LAUNCH CAMPAIGN", status: "DRAFT", audience: "Warm prospects", open: "—", click: "—" },
    { name: "Quiet pipeline nudge", type: "AUTOMATION", status: "ACTIVE PREVIEW", audience: "No activity 7d", open: "39.7%", click: "8.4%" },
  ];
  return <><section className="panel suite-panel"><SectionHeading eyebrow="CAMPAIGN STUDIO" title="Plan, write, and review before you send." action={<div className="suite-tabs">{["All content", "Email", "Sequences"].map(item => <button className={channel === item ? "active" : ""} key={item} onClick={() => setChannel(item)}>{item}</button>)}</div>} /><div className="suite-campaign-grid">{campaigns.map(campaign => <article className="campaign-card" key={campaign.name}><div className="campaign-card-top"><span className="suite-row-icon"><Mail size={16} /></span><span className="suite-status suite-status-live">{campaign.status}</span></div><span className="panel-eyebrow">{campaign.type}</span><h3>{campaign.name}</h3><p>Audience: <strong>{campaign.audience}</strong></p><div className="campaign-stats"><span><b>{campaign.open}</b><small>OPEN RATE</small></span><span><b>{campaign.click}</b><small>CLICK RATE</small></span></div><button className="template-action" onClick={() => toast.success(`Opening ${campaign.name}`)}>Open campaign <ArrowRight size={14} /></button></article>)}</div></section><section className="suite-two-col"><article className="panel suite-panel"><SectionHeading eyebrow="AUDIENCE" title="Segments that stay useful" /><div className="tag-cloud"><span><Tag size={13} /> New lead <b>318</b></span><span><Tag size={13} /> Course interest <b>184</b></span><span><Tag size={13} /> Needs follow-up <b>76</b></span><span><Tag size={13} /> Customer <b>86</b></span></div></article><article className="panel suite-panel"><SectionHeading eyebrow="AI DRAFTING" title="Start with the brief" /><div className="brief-box"><Sparkles size={18} /><div><strong>Tell Hermes what you want to say.</strong><p>“Draft a three-email welcome sequence for a new owner who downloaded our operations guide.”</p></div><button className="primary-action primary-action-small" onClick={() => toast.success("Brief added to Hermes review queue")}><ArrowRight size={15} /></button></div></article></section></>;
}

function AutomationSuite() {
  const [active, setActive] = useState<Record<string, boolean>>({ welcome: true, quiet: false, course: true });
  const flows = [
    { id: "welcome", name: "New lead welcome", trigger: "Contact subscribes to Lead magnet", actions: ["Add tag: new-lead", "Send email sequence", "Create review task"], color: "green" },
    { id: "quiet", name: "Quiet pipeline nudge", trigger: "Lead has no activity for 7 days", actions: ["Check lead stage", "Draft follow-up", "Request approval"], color: "amber" },
    { id: "course", name: "Course purchase onboarding", trigger: "Offer checkout completed", actions: ["Grant course access", "Send welcome email", "Add customer tag"], color: "blue" },
  ];
  return <><section className="panel suite-panel"><SectionHeading eyebrow="WORKFLOW BUILDER" title="Triggers become accountable actions." action={<span className="module-state-pill">DRAG & DROP PREVIEW</span>} /><div className="automation-list">{flows.map(flow => <article className="automation-row" key={flow.id}><div className="automation-row-head"><span className={`workflow-node workflow-node-${flow.color}`}><Workflow size={16} /></span><div><h3>{flow.name}</h3><p>When <strong>{flow.trigger}</strong></p></div><button className={`suite-toggle ${active[flow.id] ? "on" : ""}`} onClick={() => setActive({ ...active, [flow.id]: !active[flow.id] })} aria-label={`Toggle ${flow.name}`}><span /></button></div><div className="automation-path"><div className="automation-trigger"><small>TRIGGER</small><span>{flow.trigger}</span></div><div className="automation-line" />{flow.actions.map((action, index) => <div className="automation-action" key={action}><span>{index + 1}</span>{action}</div>)}<div className="automation-end"><Check size={13} /> HUMAN REVIEW GATE</div></div><div className="suite-footnote"><span>{active[flow.id] ? <><i className="active-dot" /> Active in preview</> : "Paused"}</span><button className="quiet-action" onClick={() => toast.success("Workflow editor opened")}>Edit workflow <ArrowRight size={13} /></button></div></article>)}</div></section></>;
}

function CommerceSuite() {
  const offers = [
    { name: "Agentic operations, explained", type: "COURSE", price: "$149", sales: "42", status: "PUBLISHED" },
    { name: "Pipeline clarity session", type: "SERVICE", price: "$420", sales: "18", status: "PUBLISHED" },
    { name: "Owner OS template pack", type: "DIGITAL DOWNLOAD", price: "$29", sales: "86", status: "DRAFT" },
  ];
  return <><section className="panel suite-panel"><SectionHeading eyebrow="OFFER CATALOG" title="Products, services, and access in one place." action={<button className="quiet-action"><Filter size={14} /> Filter</button>} /><div className="suite-table-wrap"><table className="suite-table"><thead><tr><th>OFFER</th><th>TYPE</th><th>PRICE</th><th>SALES</th><th>STATUS</th><th /></tr></thead><tbody>{offers.map(offer => <tr key={offer.name}><td><strong>{offer.name}</strong><small>Checkout + delivery connected in next phase</small></td><td>{offer.type}</td><td><b>{offer.price}</b></td><td>{offer.sales}</td><td><span className={`suite-status ${offer.status === "PUBLISHED" ? "suite-status-live" : ""}`}>{offer.status}</span></td><td><button className="icon-button" aria-label={`Open ${offer.name}`}><ChevronRight size={15} /></button></td></tr>)}</tbody></table></div></section><section className="suite-two-col"><article className="panel suite-panel"><SectionHeading eyebrow="CHECKOUT STACK" title="Raise the value without adding noise" /><div className="checkout-stack"><span><Check size={14} /> Order form</span><span><Check size={14} /> Coupon codes</span><span><Check size={14} /> Order bump</span><span><Check size={14} /> One-click upsell</span><span><Check size={14} /> Payment confirmation</span></div></article><article className="panel suite-panel"><SectionHeading eyebrow="PAYMENT READINESS" title="Connect when you are ready" /><div className="integration-placeholder"><CreditCard size={22} /><div><strong>No payment processor connected</strong><p>The frontend is ready for Stripe, PayPal, or another provider once Supabase and secrets are configured.</p></div><button className="template-action" onClick={() => toast("Payment setup is reserved for the database phase")}>View setup path <ArrowRight size={14} /></button></div></article></section></>;
}

function CoursesSuite() {
  const courses = [
    { title: "Agentic operations, explained", category: "FOUNDATIONS", progress: 72, lessons: "8 / 11 lessons", students: "124 students", color: "green" },
    { title: "Make your pipeline useful", category: "CRM", progress: 44, lessons: "5 / 12 lessons", students: "86 students", color: "blue" },
    { title: "Design a calmer growth loop", category: "GROWTH", progress: 18, lessons: "2 / 10 lessons", students: "38 students", color: "amber" },
  ];
  return <><section className="panel suite-panel"><SectionHeading eyebrow="COURSE LIBRARY" title="Teach once. Improve every cohort." action={<button className="quiet-action"><GraduationCap size={14} /> Student view</button>} /><div className="course-grid">{courses.map(course => <article className="course-card" key={course.title}><div className={`course-cover course-cover-${course.color}`}><GraduationCap size={22} /><span>{course.category}</span></div><div className="course-card-body"><h3>{course.title}</h3><div className="progress-meta"><span>{course.lessons}</span><strong>{course.progress}%</strong></div><div className="progress-track"><i style={{ width: `${course.progress}%` }} /></div><div className="course-card-foot"><span><UsersRound size={13} /> {course.students}</span><button className="quiet-action">Edit <ArrowRight size={13} /></button></div></div></article>)}</div></section><section className="suite-two-col"><article className="panel suite-panel"><SectionHeading eyebrow="MEMBERSHIP ACCESS" title="Gate the right experience" /><div className="access-list"><span><span className="access-dot access-dot-live" /> Owner plan <b>All courses</b></span><span><span className="access-dot" /> Foundations cohort <b>Course 01</b></span><span><span className="access-dot" /> Free preview <b>First lesson</b></span></div></article><article className="panel suite-panel"><SectionHeading eyebrow="STUDENT JOURNEY" title="Drip, unlock, and keep momentum" /><div className="student-journey"><span>Welcome email</span><ChevronRight size={14} /><span>Module 01</span><ChevronRight size={14} /><span>Progress check</span><ChevronRight size={14} /><span>Next lesson</span></div></article></section></>;
}

function BookingsSuite() {
  const events = [
    { name: "Strategy clarity call", duration: "45 min", availability: "Mon–Thu · 09:00–16:00", booked: "08 booked" },
    { name: "Pipeline review", duration: "30 min", availability: "Tue–Fri · 10:00–15:00", booked: "03 booked" },
    { name: "Group workshop", duration: "90 min", availability: "Next: 18 Nov · 12 seats", booked: "08 / 12 seats" },
  ];
  return <><section className="panel suite-panel"><SectionHeading eyebrow="BOOKING CALENDAR" title="Give every meeting a clear next step." action={<button className="quiet-action"><CalendarDays size={14} /> Calendar view</button>} /><div className="booking-list">{events.map(event => <article className="booking-row" key={event.name}><span className="booking-icon"><CalendarDays size={17} /></span><div><h3>{event.name}</h3><p>{event.duration} · {event.availability}</p></div><span className="booking-booked">{event.booked}</span><button className="icon-button"><ChevronRight size={15} /></button></article>)}</div></section><section className="suite-two-col"><article className="panel suite-panel"><SectionHeading eyebrow="CONFIRMATION FLOW" title="Make every booking feel intentional" /><div className="checkout-stack"><span><Check size={14} /> Booking form</span><span><Check size={14} /> Confirmation email</span><span><Check size={14} /> Calendar invite</span><span><Check size={14} /> Reminder sequence</span></div></article><article className="panel suite-panel"><SectionHeading eyebrow="AVAILABILITY" title="Your working rhythm" /><div className="availability-grid">{["MON", "TUE", "WED", "THU", "FRI"].map(day => <div key={day}><small>{day}</small><span /><span /><span className="muted-slot" /></div>)}</div></article></section></>;
}

function AffiliatesSuite() {
  const partners = [
    { name: "Mara Okafor", source: "Owner community", clicks: "842", sales: "18", commission: "$612", status: "ACTIVE" },
    { name: "Theo Martins", source: "Operations newsletter", clicks: "516", sales: "11", commission: "$374", status: "ACTIVE" },
    { name: "Asha Singh", source: "Pending invitation", clicks: "—", sales: "—", commission: "—", status: "INVITED" },
  ];
  return <><section className="panel suite-panel"><SectionHeading eyebrow="PARTNER PROGRAM" title="Grow through trusted introductions." action={<button className="quiet-action"><Copy size={14} /> Copy program link</button>} /><div className="suite-table-wrap"><table className="suite-table"><thead><tr><th>PARTNER</th><th>CLICKS</th><th>SALES</th><th>COMMISSION</th><th>STATUS</th><th /></tr></thead><tbody>{partners.map(partner => <tr key={partner.name}><td><div className="contact-cell"><span className="contact-avatar">{partner.name.split(" ").map(part => part[0]).join("")}</span><span><strong>{partner.name}</strong><small>{partner.source}</small></span></div></td><td>{partner.clicks}</td><td>{partner.sales}</td><td><b>{partner.commission}</b></td><td><span className={`suite-status ${partner.status === "ACTIVE" ? "suite-status-live" : "suite-status-warn"}`}>{partner.status}</span></td><td><button className="icon-button"><MoreHorizontal size={16} /></button></td></tr>)}</tbody></table></div></section><section className="suite-two-col"><article className="panel suite-panel"><SectionHeading eyebrow="COMMISSION POLICY" title="Keep the rules legible" /><div className="policy-lines"><span><strong>Default rate</strong><b>20%</b></span><span><strong>Cookie window</strong><b>30 days</b></span><span><strong>Payout state</strong><b>Manual review</b></span></div></article><article className="panel suite-panel"><SectionHeading eyebrow="PARTNER EXPERIENCE" title="Give affiliates what they need" /><div className="brief-box"><Handshake size={18} /><div><strong>Partner hub preview</strong><p>Links, clicks, sales, creative, and payout history will live here after database wiring.</p></div><button className="primary-action primary-action-small" onClick={() => toast.success("Partner hub preview opened")}><ArrowRight size={15} /></button></div></article></section></>;
}

function AnalyticsSuite() {
  const sources = [{ source: "Owner OS guide", visitors: "2,418", leads: "318", customers: "24", revenue: "$3,576" }, { source: "Organic search", visitors: "1,982", leads: "264", customers: "18", revenue: "$2,682" }, { source: "Partner links", visitors: "1,224", leads: "186", customers: "17", revenue: "$2,533" }, { source: "Direct / returning", visitors: "2,788", leads: "516", customers: "27", revenue: "$3,807" }];
  return <><section className="suite-two-col analytics-top"><article className="panel suite-panel"><SectionHeading eyebrow="CONVERSION TREND" title="Traffic becomes context" action={<span className="suite-status suite-status-live">LAST 30 DAYS</span>} /><div className="chart-bars">{[42, 55, 48, 68, 57, 74, 82, 66, 88, 78, 94, 86].map((height, index) => <div key={index}><span style={{ height: `${height}%` }} /><small>{index + 1}</small></div>)}</div><div className="chart-legend"><span><i className="legend-green" /> Visitors</span><span><i className="legend-blue" /> Leads</span><span><i className="legend-amber" /> Customers</span></div></article><article className="panel suite-panel"><SectionHeading eyebrow="NEXT SIGNAL" title="One useful decision" /><div className="insight-card"><span className="insight-icon"><Sparkles size={17} /></span><div><strong>Partner links are converting best.</strong><p>They bring fewer visitors than search, but convert 36% better. Hermes would recommend making the partner offer easier to share.</p></div><button className="text-action" onClick={() => toast.success("Insight saved for review")}>Save insight <ArrowRight size={13} /></button></div></article></section><section className="panel suite-panel"><SectionHeading eyebrow="SOURCE PERFORMANCE" title="Where the momentum starts" action={<button className="quiet-action">Export preview <ExternalLink size={13} /></button>} /><div className="suite-table-wrap"><table className="suite-table"><thead><tr><th>SOURCE</th><th>VISITORS</th><th>LEADS</th><th>CUSTOMERS</th><th>REVENUE</th></tr></thead><tbody>{sources.map(source => <tr key={source.source}><td><strong>{source.source}</strong></td><td>{source.visitors}</td><td>{source.leads}</td><td>{source.customers}</td><td><b>{source.revenue}</b></td></tr>)}</tbody></table></div></section></>;
}

export default function GrowthSuitePage({ path, data }: SuiteProps) {
  void data;
  const suitePath = (metricsByPath[path as SuitePath] ? path : "/funnels") as SuitePath;
  const [notice, setNotice] = useState("");
  const action = () => { setNotice(pageCopy[suitePath].action); toast.success(`${pageCopy[suitePath].action} opened in design mode — save and publish are coming next.`); };
  return <div className="page-stack"><SuiteHeader path={suitePath} onAction={action} /><MetricStrip path={suitePath} /><DemoNotice />{notice && <div className="suite-action-note"><Check size={15} /><span><strong>{notice}:</strong> Start with the mock editor below. Database persistence and external sending are intentionally reserved for the next phase.</span><button className="icon-button" onClick={() => setNotice("")}><span className="sr-only">Dismiss</span>×</button></div>}{suitePath === "/funnels" && <FunnelSuite />}{suitePath === "/marketing" && <MarketingSuite />}{suitePath === "/automations" && <AutomationSuite />}{suitePath === "/commerce" && <CommerceSuite />}{suitePath === "/courses" && <CoursesSuite />}{suitePath === "/bookings" && <BookingsSuite />}{suitePath === "/affiliates" && <AffiliatesSuite />}{suitePath === "/analytics" && <AnalyticsSuite />}<div className="roadmap-callout"><span className="roadmap-dot" /><p><strong>Honest status:</strong> This module is a polished frontend prototype. Save, send, publish, payment, and automation execution will connect to Supabase in the next phase.</p></div></div>;
}
