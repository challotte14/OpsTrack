import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertTriangle,
    Bell,
    CalendarClock,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    Clock3,
    LayoutDashboard,
    MessageSquare,
    MoreHorizontal,
    Plus,
    Search,
    Settings,
    ShieldCheck,
    SlidersHorizontal,
    UserRound,
    UsersRound,
    Wrench,
    X,
} from "lucide-react";

import {
    addTicketComment,
    assignTicket,
    createTicket,
    getDashboardSummary,
    getTicket,
    getTickets,
    updateTicketStatus,
} from "./api/opstrackApi";

const statuses = [
    "All",
    "New",
    "Assigned",
    "In Progress",
    "Waiting for User",
    "Resolved",
    "Closed",
];

const priorities = ["All", "Critical", "High", "Medium", "Low"];

const statusStyles = {
    New: "bg-blue-50 text-blue-700 border-blue-200",
    Assigned: "bg-violet-50 text-violet-700 border-violet-200",
    "In Progress": "bg-amber-50 text-amber-700 border-amber-200",
    "Waiting for User": "bg-slate-100 text-slate-700 border-slate-200",
    Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Closed: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

const priorityStyles = {
    Critical: "bg-red-50 text-red-700 border-red-200",
    High: "bg-orange-50 text-orange-700 border-orange-200",
    Medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
    Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function getViewLabel(activeView) {
    if (activeView === "dashboard") return "Dashboard";
    if (activeView === "tickets") return "Tickets";
    if (activeView === "sla") return "SLA Monitor";
    if (activeView === "agents") return "Agents";
    return "Settings";
}

function getViewTitle(activeView) {
    if (activeView === "dashboard") return "Incident Command Centre";
    if (activeView === "tickets") return "Ticket Management";
    if (activeView === "sla") return "SLA Monitor";
    if (activeView === "agents") return "Support Agents";
    return "System Settings";
}

function SidebarButton({ icon: Icon, label, active, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${active
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
        >
            <Icon className="h-4 w-4" />
            {label}
        </button>
    );
}

function MetricCard({ label, value, note, icon: Icon }) {
    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                        {value}
                    </p>
                </div>

                <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-700">
                    <Icon className="h-5 w-5" />
                </div>
            </div>

            <p className="mt-4 text-xs font-semibold text-slate-500">{note}</p>
        </motion.div>
    );
}

function TicketRow({ ticket, selected, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`grid w-full grid-cols-12 items-center gap-4 border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50 ${selected ? "bg-blue-50/70" : "bg-white"
                }`}
        >
            <div className="col-span-12 md:col-span-4">
                <p className="text-xs font-bold text-slate-400">
                    {ticket.ticketNumber}
                </p>
                <h4 className="mt-1 font-semibold text-slate-950">{ticket.title}</h4>
                <p className="mt-1 text-xs text-slate-500">{ticket.category}</p>
            </div>

            <div className="col-span-6 md:col-span-2">
                <p className="text-xs text-slate-400">Requester</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                    {ticket.requesterName || "Unknown"}
                </p>
            </div>

            <div className="col-span-6 md:col-span-2">
                <p className="text-xs text-slate-400">Assignee</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                    {ticket.assignedTo || "Unassigned"}
                </p>
            </div>

            <div className="col-span-6 md:col-span-2">
                <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${priorityStyles[ticket.priority] || priorityStyles.Medium
                        }`}
                >
                    {ticket.priority}
                </span>
            </div>

            <div className="col-span-6 md:col-span-1">
                <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyles[ticket.status] || statusStyles.New
                        }`}
                >
                    {ticket.status}
                </span>
            </div>

            <div className="col-span-12 flex justify-end md:col-span-1">
                <ChevronRight className="h-5 w-5 text-slate-300" />
            </div>
        </button>
    );
}

export default function App() {
    const [activeView, setActiveView] = useState("dashboard");

    const [summary, setSummary] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);

    const [statusFilter, setStatusFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [search, setSearch] = useState("");

    const [showCreate, setShowCreate] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [assignTo, setAssignTo] = useState("");
    const [newStatus, setNewStatus] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [newTicket, setNewTicket] = useState({
        title: "",
        description: "",
        category: "",
        priority: "Medium",
        requesterName: "",
        department: "",
        assignedTo: "",
    });

    async function loadDashboard() {
        const dashboardData = await getDashboardSummary();
        setSummary(dashboardData);
    }

    async function loadTickets() {
        const data = await getTickets({
            status: statusFilter,
            priority: priorityFilter,
            search,
        });

        setTickets(data);

        if (!selectedTicket && data.length > 0) {
            const detail = await getTicket(data[0].id);
            setSelectedTicket(detail);
            setAssignTo(detail.assignedTo || "");
            setNewStatus(detail.status || "New");
        }
    }

    async function loadAll() {
        try {
            setLoading(true);
            setError("");
            await loadDashboard();
            await loadTickets();
        } catch (err) {
            setError(err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    async function refreshSelectedTicket(id) {
        const detail = await getTicket(id);
        setSelectedTicket(detail);
        setAssignTo(detail.assignedTo || "");
        setNewStatus(detail.status || "New");
    }

    useEffect(() => {
        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        loadTickets().catch((err) => setError(err.message));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, priorityFilter]);

    async function handleSelectTicket(ticket) {
        try {
            const detail = await getTicket(ticket.id);
            setSelectedTicket(detail);
            setAssignTo(detail.assignedTo || "");
            setNewStatus(detail.status || "New");
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleSearchSubmit(event) {
        event.preventDefault();
        await loadTickets();
        setActiveView("tickets");
    }

    async function handleClearSearch() {
        try {
            setSearch("");

            const data = await getTickets({
                status: statusFilter,
                priority: priorityFilter,
            });

            setTickets(data);

            if (data.length > 0) {
                await refreshSelectedTicket(data[0].id);
            } else {
                setSelectedTicket(null);
            }
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleCreateTicket(event) {
        event.preventDefault();

        try {
            await createTicket(newTicket);

            setNewTicket({
                title: "",
                description: "",
                category: "",
                priority: "Medium",
                requesterName: "",
                department: "",
                assignedTo: "",
            });

            setShowCreate(false);
            setActiveView("tickets");

            await loadDashboard();
            await loadTickets();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleStatusUpdate() {
        if (!selectedTicket) return;

        try {
            await updateTicketStatus(selectedTicket.id, {
                status: newStatus,
                performedBy: "Support Agent",
            });

            await refreshSelectedTicket(selectedTicket.id);
            await loadDashboard();
            await loadTickets();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleAssignTicket() {
        if (!selectedTicket) return;

        try {
            await assignTicket(selectedTicket.id, {
                assignedTo: assignTo,
                performedBy: "Service Desk",
            });

            await refreshSelectedTicket(selectedTicket.id);
            await loadTickets();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleAddComment(event) {
        event.preventDefault();

        if (!selectedTicket || !newComment.trim()) return;

        try {
            await addTicketComment(selectedTicket.id, {
                authorName: "Support Agent",
                message: newComment,
            });

            setNewComment("");
            await refreshSelectedTicket(selectedTicket.id);
        } catch (err) {
            setError(err.message);
        }
    }

    const queueByStatus = useMemo(() => {
        const groups = [
            "New",
            "Assigned",
            "In Progress",
            "Waiting for User",
            "Resolved",
            "Closed",
        ];

        return groups.map((status) => ({
            label: status,
            count: tickets.filter((ticket) => ticket.status === status).length,
        }));
    }, [tickets]);

    const agents = useMemo(() => {
        const names = [
            ...new Set(tickets.map((ticket) => ticket.assignedTo).filter(Boolean)),
        ];

        return names.map((name) => ({
            name,
            assignedCount: tickets.filter((ticket) => ticket.assignedTo === name).length,
            openCount: tickets.filter(
                (ticket) =>
                    ticket.assignedTo === name &&
                    ticket.status !== "Resolved" &&
                    ticket.status !== "Closed"
            ).length,
        }));
    }, [tickets]);

    return (
        <div className="min-h-screen bg-slate-100 text-slate-950">
            <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-slate-200 bg-white p-5 lg:block">
                <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white">
                        <Wrench className="h-5 w-5" />
                    </div>

                    <div>
                        <h1 className="text-xl font-black tracking-tight">OpsTrack</h1>
                        <p className="text-xs font-semibold text-slate-500">
                            Incident operations
                        </p>
                    </div>
                </div>

                <div className="mt-8 space-y-1">
                    <SidebarButton
                        icon={LayoutDashboard}
                        label="Dashboard"
                        active={activeView === "dashboard"}
                        onClick={() => setActiveView("dashboard")}
                    />

                    <SidebarButton
                        icon={ClipboardList}
                        label="Tickets"
                        active={activeView === "tickets"}
                        onClick={() => setActiveView("tickets")}
                    />

                    <SidebarButton
                        icon={CalendarClock}
                        label="SLA Monitor"
                        active={activeView === "sla"}
                        onClick={() => setActiveView("sla")}
                    />

                    <SidebarButton
                        icon={UsersRound}
                        label="Agents"
                        active={activeView === "agents"}
                        onClick={() => setActiveView("agents")}
                    />

                    <SidebarButton
                        icon={Settings}
                        label="Settings"
                        active={activeView === "settings"}
                        onClick={() => setActiveView("settings")}
                    />
                </div>

                <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        API status
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <p className="text-sm font-bold text-slate-700">
                            Connected to Web API
                        </p>
                    </div>
                </div>
            </aside>

            <main className="lg:pl-72">
                <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-500">
                                Operations / {getViewLabel(activeView)}
                            </p>
                            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                                {getViewTitle(activeView)}
                            </h2>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <form
                                onSubmit={handleSearchSubmit}
                                className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                            >
                                <Search className="h-4 w-4 text-slate-400" />

                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search tickets..."
                                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 sm:w-64"
                                />

                                {search && (
                                    <button
                                        type="button"
                                        onClick={handleClearSearch}
                                        className="text-xs font-bold text-slate-400 hover:text-slate-900"
                                    >
                                        Clear
                                    </button>
                                )}
                            </form>

                            <button
                                type="button"
                                className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-white shadow-sm"
                            >
                                <Bell className="h-5 w-5 text-slate-600" />
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowCreate(true)}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                <Plus className="h-4 w-4" />
                                New Ticket
                            </button>
                        </div>
                    </div>
                </header>

                <div className="space-y-6 p-4 sm:p-6 lg:p-8">
                    {error && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-500 shadow-sm">
                            Loading OpsTrack...
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            {activeView === "dashboard" && (
                                <motion.div
                                    key="dashboard"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    className="space-y-6"
                                >
                                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                        <MetricCard
                                            label="Total tickets"
                                            value={summary?.totalTickets ?? 0}
                                            note="All incidents logged"
                                            icon={ClipboardList}
                                        />
                                        <MetricCard
                                            label="Open tickets"
                                            value={summary?.openTickets ?? 0}
                                            note="Not resolved or closed"
                                            icon={Clock3}
                                        />
                                        <MetricCard
                                            label="Critical incidents"
                                            value={summary?.criticalTickets ?? 0}
                                            note="Needs urgent attention"
                                            icon={AlertTriangle}
                                        />
                                        <MetricCard
                                            label="Unassigned"
                                            value={summary?.unassignedTickets ?? 0}
                                            note="Waiting for ownership"
                                            icon={UserRound}
                                        />
                                    </section>

                                    <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
                                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                            <h3 className="text-xl font-black">Queue by status</h3>

                                            <div className="mt-6 space-y-4">
                                                {queueByStatus.map((item) => (
                                                    <div key={item.label}>
                                                        <div className="mb-2 flex items-center justify-between text-sm">
                                                            <span className="font-semibold text-slate-700">
                                                                {item.label}
                                                            </span>
                                                            <span className="font-bold text-slate-950">
                                                                {item.count}
                                                            </span>
                                                        </div>

                                                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{
                                                                    width: `${Math.min(item.count * 20, 100)}%`,
                                                                }}
                                                                transition={{ duration: 0.7 }}
                                                                className="h-full rounded-full bg-slate-950"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                            <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                                                            Ticket health
                                                        </p>
                                                        <h3 className="mt-2 text-2xl font-black">
                                                            Workload overview
                                                        </h3>
                                                    </div>

                                                    <ShieldCheck className="h-7 w-7 text-emerald-300" />
                                                </div>

                                                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                                                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">
                                                            New tickets
                                                        </p>
                                                        <p className="mt-2 text-lg font-black">
                                                            {tickets.filter((ticket) => ticket.status === "New").length}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                                                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">
                                                            Assigned
                                                        </p>
                                                        <p className="mt-2 text-lg font-black">
                                                            {tickets.filter((ticket) => ticket.status === "Assigned").length}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                                                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">
                                                            In progress
                                                        </p>
                                                        <p className="mt-2 text-lg font-black">
                                                            {tickets.filter((ticket) => ticket.status === "In Progress").length}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                                                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">
                                                            Waiting for user
                                                        </p>
                                                        <p className="mt-2 text-lg font-black">
                                                            {tickets.filter((ticket) => ticket.status === "Waiting for User").length}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                                                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">
                                                            Resolved
                                                        </p>
                                                        <p className="mt-2 text-lg font-black text-emerald-300">
                                                            {tickets.filter((ticket) => ticket.status === "Resolved").length}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                                                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">
                                                            Unassigned
                                                        </p>
                                                        <p className="mt-2 text-lg font-black text-amber-300">
                                                            {summary?.unassignedTickets ?? 0}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                    </section>
                                </motion.div>
                            )}

                            {activeView === "tickets" && (
                                <motion.section
                                    key="tickets"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]"
                                >
                                    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                                        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 xl:flex-row xl:items-center xl:justify-between">
                                            <div>
                                                <h3 className="text-xl font-black">Ticket queue</h3>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    Triage, assign, and resolve internal support incidents.
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
                                                    <SlidersHorizontal className="h-4 w-4" />
                                                    Filters
                                                </div>

                                                <select
                                                    value={statusFilter}
                                                    onChange={(event) => setStatusFilter(event.target.value)}
                                                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none"
                                                >
                                                    {statuses.map((status) => (
                                                        <option key={status}>{status}</option>
                                                    ))}
                                                </select>

                                                <select
                                                    value={priorityFilter}
                                                    onChange={(event) =>
                                                        setPriorityFilter(event.target.value)
                                                    }
                                                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none"
                                                >
                                                    {priorities.map((priority) => (
                                                        <option key={priority}>{priority}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="hidden grid-cols-12 gap-4 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-400 md:grid">
                                            <span className="col-span-4">Ticket</span>
                                            <span className="col-span-2">Requester</span>
                                            <span className="col-span-2">Assignee</span>
                                            <span className="col-span-2">Priority</span>
                                            <span className="col-span-1">Status</span>
                                            <span className="col-span-1" />
                                        </div>

                                        <div>
                                            {tickets.length === 0 ? (
                                                <div className="p-8 text-sm text-slate-500">
                                                    No tickets found.
                                                </div>
                                            ) : (
                                                tickets.map((ticket) => (
                                                    <TicketRow
                                                        key={ticket.id}
                                                        ticket={ticket}
                                                        selected={selectedTicket?.id === ticket.id}
                                                        onClick={() => handleSelectTicket(ticket)}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <aside className="space-y-6">
                                        {selectedTicket && (
                                            <>
                                                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                                                                Selected ticket
                                                            </p>
                                                            <h3 className="mt-2 text-2xl font-black leading-tight">
                                                                {selectedTicket.ticketNumber}
                                                            </h3>
                                                        </div>

                                                        <button className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white">
                                                            <MoreHorizontal className="h-5 w-5 text-slate-500" />
                                                        </button>
                                                    </div>

                                                    <h4 className="mt-4 text-lg font-bold leading-snug">
                                                        {selectedTicket.title}
                                                    </h4>

                                                    <p className="mt-3 text-sm leading-6 text-slate-500">
                                                        {selectedTicket.description}
                                                    </p>

                                                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                                        <div className="rounded-2xl bg-slate-50 p-4">
                                                            <p className="text-xs font-bold text-slate-400">
                                                                Department
                                                            </p>
                                                            <p className="mt-1 font-semibold">
                                                                {selectedTicket.department}
                                                            </p>
                                                        </div>

                                                        <div className="rounded-2xl bg-slate-50 p-4">
                                                            <p className="text-xs font-bold text-slate-400">
                                                                Comments
                                                            </p>
                                                            <p className="mt-1 font-semibold">
                                                                {selectedTicket.comments?.length ?? 0}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-5 grid gap-3">
                                                        <div className="flex gap-2">
                                                            <select
                                                                value={newStatus}
                                                                onChange={(event) => setNewStatus(event.target.value)}
                                                                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none"
                                                            >
                                                                <option>New</option>
                                                                <option>Assigned</option>
                                                                <option>In Progress</option>
                                                                <option>Waiting for User</option>
                                                                <option>Resolved</option>
                                                                <option>Closed</option>
                                                            </select>

                                                            <button
                                                                type="button"
                                                                onClick={handleStatusUpdate}
                                                                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white"
                                                            >
                                                                Update
                                                            </button>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <input
                                                                value={assignTo}
                                                                onChange={(event) => setAssignTo(event.target.value)}
                                                                placeholder="Assign to..."
                                                                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                                                            />

                                                            <button
                                                                type="button"
                                                                onClick={handleAssignTicket}
                                                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700"
                                                            >
                                                                Assign
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                                    <h3 className="text-lg font-black">Add comment</h3>

                                                    <form onSubmit={handleAddComment} className="mt-4 space-y-3">
                                                        <textarea
                                                            value={newComment}
                                                            onChange={(event) => setNewComment(event.target.value)}
                                                            rows={4}
                                                            placeholder="Add a support note..."
                                                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                                                        />

                                                        <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">
                                                            Add Comment
                                                        </button>
                                                    </form>
                                                </div>

                                                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                                    <h3 className="text-lg font-black">Activity timeline</h3>

                                                    <div className="mt-5 space-y-4">
                                                        {selectedTicket.activityLogs?.length === 0 ? (
                                                            <p className="text-sm text-slate-500">
                                                                No activity yet.
                                                            </p>
                                                        ) : (
                                                            selectedTicket.activityLogs?.map((item) => (
                                                                <div key={item.id} className="flex gap-3">
                                                                    <div className="flex flex-col items-center">
                                                                        <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600">
                                                                            <MessageSquare className="h-4 w-4" />
                                                                        </div>
                                                                        <div className="mt-2 h-8 w-px bg-slate-200" />
                                                                    </div>

                                                                    <div>
                                                                        <p className="text-sm font-bold text-slate-800">
                                                                            {item.action}
                                                                        </p>
                                                                        <p className="mt-1 text-xs text-slate-500">
                                                                            {item.performedBy} ·{" "}
                                                                            {new Date(item.createdAt).toLocaleString()}
                                                                        </p>
                                                                        {(item.oldValue || item.newValue) && (
                                                                            <p className="mt-1 text-xs text-slate-500">
                                                                                {item.oldValue
                                                                                    ? `${item.oldValue} → `
                                                                                    : ""}
                                                                                {item.newValue}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </aside>
                                </motion.section>
                            )}

                            {activeView === "sla" && (
                                <motion.section
                                    key="sla"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    className="grid gap-6 lg:grid-cols-3"
                                >
                                    <MetricCard
                                        label="Critical SLA Risk"
                                        value={
                                            tickets.filter(
                                                (ticket) =>
                                                    ticket.priority === "Critical" &&
                                                    ticket.status !== "Resolved" &&
                                                    ticket.status !== "Closed"
                                            ).length
                                        }
                                        note="Critical tickets still open"
                                        icon={AlertTriangle}
                                    />

                                    <MetricCard
                                        label="Waiting for User"
                                        value={
                                            tickets.filter(
                                                (ticket) => ticket.status === "Waiting for User"
                                            ).length
                                        }
                                        note="Tickets paused for user response"
                                        icon={Clock3}
                                    />

                                    <MetricCard
                                        label="Resolved"
                                        value={
                                            tickets.filter((ticket) => ticket.status === "Resolved")
                                                .length
                                        }
                                        note="Tickets completed successfully"
                                        icon={CheckCircle2}
                                    />

                                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
                                        <h3 className="text-xl font-black">SLA workload view</h3>
                                        <p className="mt-2 text-sm text-slate-500">
                                            Open incidents grouped by priority and status.
                                        </p>

                                        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                            {priorities
                                                .filter((priority) => priority !== "All")
                                                .map((priority) => (
                                                    <div
                                                        key={priority}
                                                        className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                                                    >
                                                        <p className="text-sm font-bold text-slate-500">
                                                            {priority}
                                                        </p>
                                                        <p className="mt-2 text-3xl font-black">
                                                            {
                                                                tickets.filter(
                                                                    (ticket) =>
                                                                        ticket.priority === priority &&
                                                                        ticket.status !== "Resolved" &&
                                                                        ticket.status !== "Closed"
                                                                ).length
                                                            }
                                                        </p>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </motion.section>
                            )}

                            {activeView === "agents" && (
                                <motion.section
                                    key="agents"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                                >
                                    <h3 className="text-xl font-black">Support Agents</h3>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Agent workload based on currently assigned tickets.
                                    </p>

                                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                        {agents.length === 0 ? (
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                                                No assigned agents yet.
                                            </div>
                                        ) : (
                                            agents.map((agent) => (
                                                <div
                                                    key={agent.name}
                                                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-950 text-white">
                                                            <UserRound className="h-5 w-5" />
                                                        </div>

                                                        <div>
                                                            <p className="font-black text-slate-950">
                                                                {agent.name}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                Support agent
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-5 grid grid-cols-2 gap-3">
                                                        <div className="rounded-xl bg-white p-4">
                                                            <p className="text-xs font-bold text-slate-400">
                                                                Assigned
                                                            </p>
                                                            <p className="mt-1 text-2xl font-black">
                                                                {agent.assignedCount}
                                                            </p>
                                                        </div>

                                                        <div className="rounded-xl bg-white p-4">
                                                            <p className="text-xs font-bold text-slate-400">
                                                                Open
                                                            </p>
                                                            <p className="mt-1 text-2xl font-black">
                                                                {agent.openCount}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </motion.section>
                            )}

                            {activeView === "settings" && (
                                <motion.section
                                    key="settings"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm"
                                >
                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                                        Backend connected
                                    </p>

                                    <h3 className="mt-2 text-2xl font-black">
                                        ASP.NET Core Web API
                                    </h3>

                                    <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65">
                                        OpsTrack is connected to a local ASP.NET Core Web API with
                                        EF Core, SQLite persistence, ticket endpoints, status
                                        transitions, assignment actions, comments, activity logs,
                                        and dashboard summaries.
                                    </p>

                                    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {[
                                            "Ticket endpoints",
                                            "EF Core models",
                                            "SQLite database",
                                            "Status transitions",
                                            "Audit logging",
                                            "Dashboard summaries",
                                        ].map((item) => (
                                            <div
                                                key={item}
                                                className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm font-semibold text-white/80"
                                            >
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </motion.section>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </main>

            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm"
                    >
                        <motion.form
                            onSubmit={handleCreateTicket}
                            initial={{ x: 420 }}
                            animate={{ x: 0 }}
                            exit={{ x: 420 }}
                            transition={{ type: "spring", damping: 30, stiffness: 260 }}
                            className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl"
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-slate-500">Create</p>
                                    <h3 className="text-2xl font-black">New support ticket</h3>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="mt-7 grid gap-4">
                                <input
                                    value={newTicket.title}
                                    onChange={(event) =>
                                        setNewTicket({ ...newTicket, title: event.target.value })
                                    }
                                    className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                                    placeholder="Ticket title"
                                    required
                                />

                                <input
                                    value={newTicket.category}
                                    onChange={(event) =>
                                        setNewTicket({ ...newTicket, category: event.target.value })
                                    }
                                    className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                                    placeholder="Category"
                                    required
                                />

                                <select
                                    value={newTicket.priority}
                                    onChange={(event) =>
                                        setNewTicket({ ...newTicket, priority: event.target.value })
                                    }
                                    className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                                >
                                    <option>Critical</option>
                                    <option>High</option>
                                    <option>Medium</option>
                                    <option>Low</option>
                                </select>

                                <input
                                    value={newTicket.requesterName}
                                    onChange={(event) =>
                                        setNewTicket({
                                            ...newTicket,
                                            requesterName: event.target.value,
                                        })
                                    }
                                    className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                                    placeholder="Requester name"
                                    required
                                />

                                <input
                                    value={newTicket.department}
                                    onChange={(event) =>
                                        setNewTicket({
                                            ...newTicket,
                                            department: event.target.value,
                                        })
                                    }
                                    className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                                    placeholder="Department"
                                    required
                                />

                                <input
                                    value={newTicket.assignedTo}
                                    onChange={(event) =>
                                        setNewTicket({
                                            ...newTicket,
                                            assignedTo: event.target.value,
                                        })
                                    }
                                    className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                                    placeholder="Assigned to optional"
                                />

                                <textarea
                                    rows={6}
                                    value={newTicket.description}
                                    onChange={(event) =>
                                        setNewTicket({
                                            ...newTicket,
                                            description: event.target.value,
                                        })
                                    }
                                    className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                                    placeholder="Describe the issue..."
                                    required
                                />

                                <button className="rounded-2xl bg-slate-950 px-5 py-4 font-bold text-white">
                                    Create Ticket
                                </button>
                            </div>
                        </motion.form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}