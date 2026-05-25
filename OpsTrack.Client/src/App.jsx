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
    ShieldCheck,
    SlidersHorizontal,
    UserRound,
    UsersRound,
    Wrench,
    X,
} from "lucide-react";

import {
    addTicketComment,
    abandonTicket,
    assignTicket,
    cancelTicketWithReason,
    createTicket,
    getCurrentUser,
    getDashboardSummary,
    getSupportAgents,
    getTicket,
    getTickets,
    loginUser,
    registerUser,
    removeToken,
    saveToken,
    updateCurrentUserProfile,
    updateTicketStatus,
    getNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} from "./api/opstrackApi";

const statuses = [
    "All",
    "New",
    "Assigned",
    "In Progress",
    "Waiting for User",
    "Resolved",
    "Closed",
    "Cancelled",
    "Abandoned",
];

const terminalStatuses = ["Resolved", "Closed", "Cancelled", "Abandoned"];
const activeTicketStatuses = ["New", "Assigned", "In Progress", "Waiting for User"];
const cancellableStatuses = activeTicketStatuses;
const assignableStatuses = activeTicketStatuses;
const reOpenableStatuses = ["Closed"];
const abandonableStatuses = ["Cancelled"];

const ticketUpdateStatuses = [
    "New",
    "Assigned",
    "In Progress",
    "Waiting for User",
    "Resolved",
    "Closed",
];

const priorities = ["All", "Critical", "High", "Medium", "Low"];

const roleOptions = [
    {
        value: "SupportAgent",
        label: "Support Agent",
    },
    {
        value: "Employee",
        label: "Employee",
    },
    {
        value: "Admin",
        label: "Admin",
    },
];

const statusStyles = {
    New: "bg-blue-50 text-blue-700 border-blue-200",
    Assigned: "bg-violet-50 text-violet-700 border-violet-200",
    "In Progress": "bg-amber-50 text-amber-700 border-amber-200",
    "Waiting for User": "bg-slate-100 text-slate-700 border-slate-200",
    Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Closed: "bg-zinc-100 text-zinc-700 border-zinc-200",
    Cancelled: "bg-red-50 text-red-700 border-red-200",
    Abandoned: "bg-amber-50 text-amber-700 border-amber-200",
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
    if (activeView === "admin") return "Admin Console";
    return "Profile";
}

function getViewTitle(activeView) {
    if (activeView === "dashboard") return "Incident Command Centre";
    if (activeView === "tickets") return "Ticket Management";
    if (activeView === "sla") return "SLA Monitor";
    if (activeView === "agents") return "Support Agents";
    if (activeView === "admin") return "Admin Console";
    return "Profile";
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
                <h4 className="mt-1 font-semibold text-slate-950">
                    {ticket.title}
                </h4>
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

function AuthScreen({ onAuthenticated }) {
    const [mode, setMode] = useState("login");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [roleOpen, setRoleOpen] = useState(false);

    const [form, setForm] = useState({
        fullName: "",
        email: "",
        password: "",
        role: "SupportAgent",
    });

    const selectedRole = roleOptions.find((role) => role.value === form.role) || roleOptions[0];

    function switchMode(nextMode) {
        setMode(nextMode);
        setError("");
        setRoleOpen(false);
    }

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            setLoading(true);
            setError("");

            if (mode === "register") {
                await registerUser({
                    fullName: form.fullName,
                    email: form.email,
                    password: form.password,
                    role: form.role,
                });
            }

            const loginResponse = await loginUser({
                email: form.email,
                password: form.password,
            });

            saveToken(loginResponse.token);

            const user = await getCurrentUser();

            onAuthenticated(user);
        } catch (err) {
            setError(err.message || "Authentication failed.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="grid min-h-screen place-items-center bg-slate-100 px-4 py-8 text-slate-950">
            <div className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-8 shadow-2xl">
                <div className="flex items-center gap-3">
                    <div className="grid h-14 w-14 place-items-center rounded-3xl bg-slate-950 text-white shadow-lg">
                        <Wrench className="h-6 w-6" />
                    </div>

                    <div>
                        <h1 className="text-3xl font-black tracking-tight">OpsTrack</h1>
                        <p className="text-sm font-medium text-slate-500">
                            Incident operations portal
                        </p>
                    </div>
                </div>

                <div className="mt-8 rounded-2xl bg-slate-100 p-1">
                    <div className="grid grid-cols-2 gap-1">
                        <button
                            type="button"
                            onClick={() => switchMode("login")}
                            className={`rounded-2xl px-4 py-3 text-sm font-black transition-all ${mode === "login"
                                ? "bg-white text-slate-950 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                                }`}
                        >
                            Login
                        </button>

                        <button
                            type="button"
                            onClick={() => switchMode("register")}
                            className={`rounded-2xl px-4 py-3 text-sm font-black transition-all ${mode === "register"
                                ? "bg-white text-slate-950 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                                }`}
                        >
                            Register
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                    {mode === "register" && (
                        <>
                            <div>
                                <label className="mb-3 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                                    Full Name
                                </label>

                                <input
                                    value={form.fullName}
                                    onChange={(event) =>
                                        setForm({ ...form, fullName: event.target.value })
                                    }
                                    placeholder="Enter your full name"
                                    className="h-14 w-full rounded-3xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-3 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                                    Account Role
                                </label>

                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setRoleOpen((previous) => !previous)}
                                        className={`group flex w-full items-center justify-between rounded-3xl border bg-white px-5 py-4 text-left transition-all duration-200 ${roleOpen
                                            ? "border-slate-400 ring-4 ring-slate-100"
                                            : "border-slate-200 hover:border-slate-300"
                                            }`}
                                    >
                                        <div>
                                            <p className="text-sm font-black text-slate-900">
                                                {selectedRole.label}
                                            </p>

                                        </div>

                                        <div
                                            className={`grid h-9 w-9 place-items-center rounded-full bg-slate-100 transition ${roleOpen ? "rotate-180" : ""
                                                }`}
                                        >
                                            <ChevronRight className="h-4 w-4 rotate-90 text-slate-500" />
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {roleOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                                                transition={{ duration: 0.16 }}
                                                className="absolute left-0 right-0 top-[calc(100%+12px)] z-50 overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl"
                                            >
                                                {roleOptions.map((role) => {
                                                    const selected = form.role === role.value;

                                                    return (
                                                        <button
                                                            key={role.value}
                                                            type="button"
                                                            onClick={() => {
                                                                setForm({ ...form, role: role.value });
                                                                setRoleOpen(false);
                                                            }}
                                                            className={`flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left transition ${selected
                                                                ? "bg-slate-950 text-white"
                                                                : "hover:bg-slate-100"
                                                                }`}
                                                        >
                                                            <div>
                                                                <p
                                                                    className={`text-sm font-black ${selected
                                                                        ? "text-white"
                                                                        : "text-slate-900"
                                                                        }`}
                                                                >
                                                                    {role.label}
                                                                </p>

                                                                <p
                                                                    className={`mt-1 text-xs ${selected
                                                                        ? "text-slate-300"
                                                                        : "text-slate-500"
                                                                        }`}
                                                                >
                                                                    {role.description}
                                                                </p>
                                                            </div>

                                                            {selected && (
                                                                <CheckCircle2 className="h-5 w-5 text-white" />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </>
                    )}

                    <div>
                        <label className="mb-3 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                            Email Address
                        </label>

                        <input
                            value={form.email}
                            onChange={(event) =>
                                setForm({ ...form, email: event.target.value })
                            }
                            type="email"
                            placeholder="Enter your email"
                            className="h-14 w-full rounded-3xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-3 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                            Password
                        </label>

                        <input
                            value={form.password}
                            onChange={(event) =>
                                setForm({ ...form, password: event.target.value })
                            }
                            type="password"
                            placeholder="Enter your password"
                            className="h-14 w-full rounded-3xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                            required
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="mt-2 flex h-14 w-full items-center justify-center rounded-3xl bg-slate-950 text-sm font-black text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading
                            ? "Please wait..."
                            : mode === "login"
                                ? "Login"
                                : "Create account"}
                    </button>
                </form>
            </div>
        </div>
    );
}
export default function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [authChecking, setAuthChecking] = useState(true);
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

    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationsLoading, setNotificationsLoading] = useState(false);

    const [profileName, setProfileName] = useState("");
    const [profileSaving, setProfileSaving] = useState(false);

    const [supportAgents, setSupportAgents] = useState([]);
    const [adminAssignByTicket, setAdminAssignByTicket] = useState({});

    const [cancelTarget, setCancelTarget] = useState(null);
    const [cancelReason, setCancelReason] = useState("");
    const [cancellingTicket, setCancellingTicket] = useState(false);

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

    const isAdmin = currentUser?.role === "Admin";
    const isSupportAgent = currentUser?.role === "SupportAgent";
    const isEmployee = currentUser?.role === "Employee";

    const visibleTickets = useMemo(() => {
        if (isAdmin) {
            return tickets;
        }

        if (isSupportAgent) {
            return tickets.filter(
                (ticket) =>
                    ticket.assignedTo === currentUser?.fullName ||
                    ticket.assignedTo === currentUser?.email
            );
        }

        if (isEmployee) {
            return tickets.filter(
                (ticket) =>
                    ticket.requesterName === currentUser?.fullName ||
                    ticket.requesterName === currentUser?.email
            );
        }

        return tickets;
    }, [tickets, currentUser, isAdmin, isSupportAgent, isEmployee]);

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

    async function loadNotifications() {
        try {
            setNotificationsLoading(true);

            const [items, unread] = await Promise.all([
                getNotifications(),
                getUnreadNotificationCount(),
            ]);

            setNotifications(items);
            setUnreadCount(unread.count ?? 0);
        } catch (err) {
            setError(err.message || "Failed to load notifications.");
        } finally {
            setNotificationsLoading(false);
        }
    }

    async function loadSupportAgents() {
        if (!isAdmin) return;

        const agents = await getSupportAgents();
        setSupportAgents(agents);
    }

    async function loadAll() {
        try {
            setLoading(true);
            setError("");

            await loadDashboard();
            await loadTickets();
            await loadNotifications();

            if (currentUser?.role === "Admin") {
                const agents = await getSupportAgents();
                setSupportAgents(agents);
            }
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
        async function checkAuth() {
            try {
                const user = await getCurrentUser();
                setCurrentUser(user);
            } catch {
                removeToken();
                setCurrentUser(null);
            } finally {
                setAuthChecking(false);
            }
        }

        checkAuth();
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        setProfileName(currentUser.fullName || "");
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser) return;

        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser) return;

        loadTickets().catch((err) => setError(err.message));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, priorityFilter, currentUser]);

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

    async function handleNotificationClick(notification) {
        try {
            if (!notification.isRead) {
                await markNotificationAsRead(notification.id);
            }

            await loadNotifications();

            if (notification.ticketId) {
                const detail = await getTicket(notification.ticketId);
                setSelectedTicket(detail);
                setAssignTo(detail.assignedTo || "");
                setNewStatus(detail.status || "New");
                setActiveView("tickets");
                setShowNotifications(false);
            }
        } catch (err) {
            setError(err.message || "Failed to open notification.");
        }
    }

    async function handleMarkAllNotificationsRead() {
        try {
            await markAllNotificationsAsRead();
            await loadNotifications();
        } catch (err) {
            setError(err.message || "Failed to mark notifications as read.");
        }
    }

    function handleLogout() {
        removeToken();
        setCurrentUser(null);
        setSummary(null);
        setTickets([]);
        setSelectedTicket(null);
        setLoading(true);
        setActiveView("dashboard");
        setShowNotifications(false);
        setNotifications([]);
        setUnreadCount(0);
        setProfileName("");
        setSupportAgents([]);
        setAdminAssignByTicket({});
        setCancelTarget(null);
        setCancelReason("");
        setCancellingTicket(false);
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
            await loadNotifications();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleStatusUpdate() {
        if (!selectedTicket) return;

        try {
            await updateTicketStatus(selectedTicket.id, {
                status: newStatus,
                performedBy: currentUser?.fullName || "Support Agent",
            });

            await refreshSelectedTicket(selectedTicket.id);
            await loadDashboard();
            await loadTickets();
            await loadNotifications();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleAssignTicket() {
        if (!selectedTicket) return;

        try {
            await assignTicket(selectedTicket.id, {
                assignedTo: assignTo,
                performedBy: currentUser?.fullName || "Service Desk",
            });

            await refreshSelectedTicket(selectedTicket.id);
            await loadTickets();
            await loadNotifications();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleAddComment(event) {
        event.preventDefault();

        if (!selectedTicket || !newComment.trim()) return;

        try {
            await addTicketComment(selectedTicket.id, {
                authorName: currentUser?.fullName || "Support Agent",
                message: newComment,
            });

            setNewComment("");
            await refreshSelectedTicket(selectedTicket.id);
            await loadNotifications();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleCloseTicket(ticket) {
        try {
            setError("");

            await updateTicketStatus(ticket.id, {
                status: "Closed",
                performedBy: currentUser?.fullName || "Support Agent",
            });

            await refreshSelectedTicket(ticket.id);
            await loadDashboard();
            await loadTickets();
            await loadNotifications();
        } catch (err) {
            setError(err.message || "Failed to close ticket.");
        }
    }

    function handleCancelTicket(ticket) {
        setCancelTarget(ticket);
        setCancelReason("");
    }

    async function confirmCancelTicket() {
        if (!cancelTarget) return;

        if (!cancelReason.trim()) {
            setError("Please provide a cancellation reason.");
            return;
        }

        try {
            setCancellingTicket(true);
            setError("");

            await cancelTicketWithReason(cancelTarget.id, {
                performedBy: currentUser?.fullName || "Support Agent",
                reason: cancelReason.trim(),
            });

            await refreshSelectedTicket(cancelTarget.id);
            await loadDashboard();
            await loadTickets();
            await loadNotifications();

            setCancelTarget(null);
            setCancelReason("");
        } catch (err) {
            setError(err.message || "Failed to cancel ticket.");
        } finally {
            setCancellingTicket(false);
        }
    }

    async function handleReopenTicket(ticket) {
        try {
            setError("");

            await updateTicketStatus(ticket.id, {
                status: "New",
                performedBy: currentUser?.fullName || "Support Agent",
            });

            await refreshSelectedTicket(ticket.id);
            await loadDashboard();
            await loadTickets();
            await loadNotifications();
        } catch (err) {
            setError(err.message || "Failed to reopen ticket.");
        }
    }

    async function handleAbandonTicket(ticket) {
        try {
            setError("");

            await abandonTicket(ticket.id, {
                performedBy: currentUser?.fullName || "Support Agent",
                reason: "Cancelled ticket marked as abandoned.",
            });

            await refreshSelectedTicket(ticket.id);
            await loadDashboard();
            await loadTickets();
            await loadNotifications();
        } catch (err) {
            setError(err.message || "Failed to mark ticket as abandoned.");
        }
    }

    async function handleUpdateProfile(event) {
        event.preventDefault();

        try {
            setProfileSaving(true);
            setError("");

            const updatedUser = await updateCurrentUserProfile({
                fullName: profileName,
            });

            setCurrentUser(updatedUser);

            await loadTickets();
            await loadNotifications();
        } catch (err) {
            setError(err.message || "Failed to update profile.");
        } finally {
            setProfileSaving(false);
        }
    }

    async function handleAdminAssignTicket(ticket) {
        try {
            const assignedTo = adminAssignByTicket[ticket.id];

            if (!assignedTo) {
                setError("Please select a support agent.");
                return;
            }

            await assignTicket(ticket.id, {
                assignedTo,
                performedBy: currentUser?.fullName || "Admin",
            });

            setAdminAssignByTicket((previous) => ({
                ...previous,
                [ticket.id]: "",
            }));

            await refreshSelectedTicket(ticket.id);
            await loadDashboard();
            await loadTickets();
            await loadNotifications();
            await loadSupportAgents();
        } catch (err) {
            setError(err.message || "Failed to assign ticket.");
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
            "Cancelled",
            "Abandoned",
        ];

        return groups.map((status) => ({
            label: status,
            count: visibleTickets.filter((ticket) => ticket.status === status).length,
        }));
    }, [visibleTickets]);

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
                    !terminalStatuses.includes(ticket.status)
            ).length,
        }));
    }, [tickets]);

    if (authChecking) {
        return (
            <div className="grid min-h-screen place-items-center bg-slate-100 text-slate-500">
                Checking session...
            </div>
        );
    }

    if (!currentUser) {
        return <AuthScreen onAuthenticated={setCurrentUser} />;
    }

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
                        label={isEmployee ? "My Tickets" : "Tickets"}
                        active={activeView === "tickets"}
                        onClick={() => setActiveView("tickets")}
                    />

                    {(isAdmin || isSupportAgent) && (
                        <SidebarButton
                            icon={CalendarClock}
                            label="SLA Monitor"
                            active={activeView === "sla"}
                            onClick={() => setActiveView("sla")}
                        />
                    )}

                    {isAdmin && (
                        <SidebarButton
                            icon={UsersRound}
                            label="Agents"
                            active={activeView === "agents"}
                            onClick={() => setActiveView("agents")}
                        />
                    )}

                    {isAdmin && (
                        <SidebarButton
                            icon={ShieldCheck}
                            label="Admin Console"
                            active={activeView === "admin"}
                            onClick={() => setActiveView("admin")}
                        />
                    )}

                    <SidebarButton
                        icon={UserRound}
                        label="Profile"
                        active={activeView === "profile"}
                        onClick={() => setActiveView("profile")}
                    />
                </div>

                <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        Signed in as
                    </p>

                    <div className="mt-3 flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-950 text-sm font-black text-white">
                            {currentUser?.fullName
                                ?.split(" ")
                                .map((part) => part[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase() || "U"}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-slate-800">
                                {currentUser?.fullName}
                            </p>
                            <p className="truncate text-xs font-semibold text-slate-500">
                                {currentUser?.role}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100"
                    >
                        Logout
                    </button>
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

                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowNotifications((previous) => !previous)
                                    }
                                    className="relative grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50"
                                >
                                    <Bell className="h-5 w-5 text-slate-600" />

                                    {unreadCount > 0 && (
                                        <span className="absolute right-2 top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    )}
                                </button>

                                <AnimatePresence>
                                    {showNotifications && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                            transition={{ duration: 0.18 }}
                                            className="absolute right-0 top-14 z-50 w-[360px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
                                        >
                                            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                                                <div>
                                                    <h3 className="text-sm font-black text-slate-950">
                                                        Notifications
                                                    </h3>
                                                    <p className="text-xs font-medium text-slate-500">
                                                        {unreadCount} unread
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={handleMarkAllNotificationsRead}
                                                    className="text-xs font-bold text-slate-500 hover:text-slate-950"
                                                >
                                                    Mark all read
                                                </button>
                                            </div>

                                            <div className="max-h-[420px] overflow-y-auto">
                                                {notificationsLoading ? (
                                                    <div className="p-5 text-sm text-slate-500">
                                                        Loading notifications...
                                                    </div>
                                                ) : notifications.length === 0 ? (
                                                    <div className="p-5 text-sm text-slate-500">
                                                        No notifications yet.
                                                    </div>
                                                ) : (
                                                    notifications.map((notification) => (
                                                        <button
                                                            key={notification.id}
                                                            type="button"
                                                            onClick={() =>
                                                                handleNotificationClick(notification)
                                                            }
                                                            className={`w-full border-b border-slate-100 px-5 py-4 text-left transition hover:bg-slate-50 ${!notification.isRead
                                                                ? "bg-blue-50/40"
                                                                : "bg-white"
                                                                }`}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <span
                                                                    className={`mt-1 h-2.5 w-2.5 rounded-full ${!notification.isRead
                                                                        ? "bg-blue-500"
                                                                        : "bg-slate-300"
                                                                        }`}
                                                                />

                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center justify-between gap-3">
                                                                        <p className="truncate text-sm font-black text-slate-900">
                                                                            {notification.title}
                                                                        </p>

                                                                        <span className="shrink-0 text-[11px] font-semibold text-slate-400">
                                                                            {new Date(
                                                                                notification.createdAt
                                                                            ).toLocaleString()}
                                                                        </span>
                                                                    </div>

                                                                    <p className="mt-1 text-sm leading-6 text-slate-500">
                                                                        {notification.message}
                                                                    </p>

                                                                    {notification.ticketId && (
                                                                        <p className="mt-2 text-xs font-bold text-slate-400">
                                                                            Ticket #{notification.ticketId}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowNotifications(false);
                                    setShowCreate(true);
                                }}
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
                                            value={
                                                isAdmin
                                                    ? summary?.totalTickets ?? 0
                                                    : visibleTickets.length
                                            }
                                            note="All incidents logged"
                                            icon={ClipboardList}
                                        />
                                        <MetricCard
                                            label="Open tickets"
                                            value={
                                                visibleTickets.filter(
                                                    (ticket) =>
                                                        !terminalStatuses.includes(ticket.status)
                                                ).length
                                            }
                                            note="Not resolved or closed"
                                            icon={Clock3}
                                        />
                                        <MetricCard
                                            label="Critical incidents"
                                            value={
                                                visibleTickets.filter(
                                                    (ticket) => ticket.priority === "Critical"
                                                ).length
                                            }
                                            note="Needs urgent attention"
                                            icon={AlertTriangle}
                                        />
                                        <MetricCard
                                            label="Unassigned"
                                            value={
                                                isAdmin
                                                    ? summary?.unassignedTickets ?? 0
                                                    : visibleTickets.filter(
                                                        (ticket) => !ticket.assignedTo
                                                    ).length
                                            }
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
                                                                    width: `${Math.min(
                                                                        item.count * 20,
                                                                        100
                                                                    )}%`,
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
                                                {[
                                                    [
                                                        "New tickets",
                                                        visibleTickets.filter(
                                                            (ticket) => ticket.status === "New"
                                                        ).length,
                                                    ],
                                                    [
                                                        "Assigned",
                                                        visibleTickets.filter(
                                                            (ticket) => ticket.status === "Assigned"
                                                        ).length,
                                                    ],
                                                    [
                                                        "In progress",
                                                        visibleTickets.filter(
                                                            (ticket) =>
                                                                ticket.status === "In Progress"
                                                        ).length,
                                                    ],
                                                    [
                                                        "Waiting for user",
                                                        visibleTickets.filter(
                                                            (ticket) =>
                                                                ticket.status ===
                                                                "Waiting for User"
                                                        ).length,
                                                    ],
                                                    [
                                                        "Resolved",
                                                        visibleTickets.filter(
                                                            (ticket) =>
                                                                ticket.status === "Resolved"
                                                        ).length,
                                                    ],
                                                    [
                                                        "Unassigned",
                                                        visibleTickets.filter(
                                                            (ticket) => !ticket.assignedTo
                                                        ).length,
                                                    ],
                                                ].map(([label, value]) => (
                                                    <div
                                                        key={label}
                                                        className="rounded-2xl border border-white/10 bg-white/[0.05] p-4"
                                                    >
                                                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">
                                                            {label}
                                                        </p>
                                                        <p className="mt-2 text-lg font-black">
                                                            {value}
                                                        </p>
                                                    </div>
                                                ))}
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
                                                <h3 className="text-xl font-black">
                                                    {isEmployee
                                                        ? "My ticket queue"
                                                        : "Ticket queue"}
                                                </h3>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    {isEmployee
                                                        ? "Track incidents submitted from your account."
                                                        : "Triage, assign, and resolve internal support incidents."}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
                                                    <SlidersHorizontal className="h-4 w-4" />
                                                    Filters
                                                </div>

                                                <select
                                                    value={statusFilter}
                                                    onChange={(event) =>
                                                        setStatusFilter(event.target.value)
                                                    }
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
                                            {visibleTickets.length === 0 ? (
                                                <div className="p-8 text-sm text-slate-500">
                                                    No tickets found for your role.
                                                </div>
                                            ) : (
                                                visibleTickets.map((ticket) => (
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

                                                    {!isEmployee && (
                                                        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                                                                Ticket actions
                                                            </p>

                                                            {assignableStatuses.includes(selectedTicket.status) && (
                                                                <div className="mt-4 grid gap-3">
                                                                    <div className="flex gap-2">
                                                                        <select
                                                                            value={ticketUpdateStatuses.includes(newStatus) ? newStatus : selectedTicket.status}
                                                                            onChange={(event) => setNewStatus(event.target.value)}
                                                                            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none"
                                                                        >
                                                                            {ticketUpdateStatuses.map((status) => (
                                                                                <option key={status}>{status}</option>
                                                                            ))}
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
                                                                            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                                                                        />

                                                                        <button
                                                                            type="button"
                                                                            onClick={handleAssignTicket}
                                                                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700"
                                                                        >
                                                                            Assign
                                                                        </button>
                                                                    </div>

                                                                    {cancellableStatuses.includes(selectedTicket.status) && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleCancelTicket(selectedTicket)}
                                                                            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-100"
                                                                        >
                                                                            Cancel ticket
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {reOpenableStatuses.includes(selectedTicket.status) && (
                                                                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                                                                    <p className="text-sm font-semibold text-slate-500">
                                                                        This ticket is closed. You can reopen it if work needs to continue.
                                                                    </p>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleReopenTicket(selectedTicket)}
                                                                        className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white"
                                                                    >
                                                                        Reopen ticket
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {abandonableStatuses.includes(selectedTicket.status) && (
                                                                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                                                    <p className="text-sm font-semibold text-amber-800">
                                                                        This ticket was cancelled. If no further action is required, mark it as abandoned.
                                                                    </p>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleAbandonTicket(selectedTicket)}
                                                                        className="mt-4 w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-bold text-white hover:bg-amber-600"
                                                                    >
                                                                        Mark abandoned
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {selectedTicket.status === "Resolved" && (
                                                                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                                                                    This ticket has been resolved. Reopen it from the Admin Console only if more work is required.
                                                                </div>
                                                            )}

                                                            {selectedTicket.status === "Abandoned" && (
                                                                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-500">
                                                                    This ticket has been abandoned and no further workflow actions are available.
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}


                                                </div>

                                                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                                    <h3 className="text-lg font-black">Add comment</h3>

                                                    <form
                                                        onSubmit={handleAddComment}
                                                        className="mt-4 space-y-3"
                                                    >
                                                        <textarea
                                                            value={newComment}
                                                            onChange={(event) =>
                                                                setNewComment(event.target.value)
                                                            }
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
                                                    <h3 className="text-lg font-black">
                                                        Activity timeline
                                                    </h3>

                                                    <div className="mt-5 space-y-4">
                                                        {selectedTicket.activityLogs?.length ===
                                                            0 ? (
                                                            <p className="text-sm text-slate-500">
                                                                No activity yet.
                                                            </p>
                                                        ) : (
                                                            selectedTicket.activityLogs?.map(
                                                                (item) => (
                                                                    <div
                                                                        key={item.id}
                                                                        className="flex gap-3"
                                                                    >
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
                                                                                {new Date(
                                                                                    item.createdAt
                                                                                ).toLocaleString()}
                                                                            </p>
                                                                            {(item.oldValue ||
                                                                                item.newValue) && (
                                                                                    <p className="mt-1 text-xs text-slate-500">
                                                                                        {item.oldValue
                                                                                            ? `${item.oldValue} → `
                                                                                            : ""}
                                                                                        {item.newValue}
                                                                                    </p>
                                                                                )}
                                                                        </div>
                                                                    </div>
                                                                )
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </aside>
                                </motion.section>
                            )}

                            {activeView === "sla" && (isAdmin || isSupportAgent) && (
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
                                            visibleTickets.filter(
                                                (ticket) =>
                                                    ticket.priority === "Critical" &&
                                                    !terminalStatuses.includes(ticket.status)
                                            ).length
                                        }
                                        note="Critical tickets still open"
                                        icon={AlertTriangle}
                                    />

                                    <MetricCard
                                        label="Waiting for User"
                                        value={
                                            visibleTickets.filter(
                                                (ticket) =>
                                                    ticket.status === "Waiting for User"
                                            ).length
                                        }
                                        note="Tickets paused for user response"
                                        icon={Clock3}
                                    />

                                    <MetricCard
                                        label="Resolved"
                                        value={
                                            visibleTickets.filter(
                                                (ticket) => ticket.status === "Resolved"
                                            ).length
                                        }
                                        note="Tickets completed successfully"
                                        icon={CheckCircle2}
                                    />

                                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
                                        <h3 className="text-xl font-black">
                                            SLA workload view
                                        </h3>
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
                                                                visibleTickets.filter(
                                                                    (ticket) =>
                                                                        ticket.priority ===
                                                                        priority &&
                                                                        !terminalStatuses.includes(ticket.status)
                                                                ).length
                                                            }
                                                        </p>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </motion.section>
                            )}

                            {activeView === "agents" && isAdmin && (
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

                            {activeView === "admin" && isAdmin && (
                                <motion.section
                                    key="admin"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]"
                                >
                                    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                                        <div className="border-b border-slate-200 p-6">
                                            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                                                Admin Console
                                            </p>

                                            <h3 className="mt-2 text-2xl font-black text-slate-950">
                                                Ticket governance
                                            </h3>

                                            <p className="mt-2 text-sm leading-7 text-slate-500">
                                                Select a ticket to review its details, comments, activity history,
                                                assignment, and lifecycle controls.
                                            </p>
                                        </div>

                                        <div className="divide-y divide-slate-100">
                                            {tickets.length === 0 ? (
                                                <div className="p-6 text-sm text-slate-500">
                                                    No tickets available.
                                                </div>
                                            ) : (
                                                tickets.map((ticket) => (
                                                    <button
                                                        key={ticket.id}
                                                        type="button"
                                                        onClick={() => handleSelectTicket(ticket)}
                                                        className={`relative w-full p-5 text-left transition hover:bg-slate-50 ${selectedTicket?.id === ticket.id
                                                            ? "bg-blue-50/80 ring-2 ring-inset ring-blue-200"
                                                            : "bg-white"
                                                            }`}
                                                    >
                                                        {selectedTicket?.id === ticket.id && (
                                                            <span className="absolute left-0 top-0 h-full w-1 bg-blue-600" />
                                                        )}

                                                        <div className="flex items-start justify-between gap-4">
                                                            <div>
                                                                <p className="text-xs font-black text-slate-400">
                                                                    {ticket.ticketNumber}
                                                                </p>

                                                                <h4 className="mt-1 font-black text-slate-950">
                                                                    {ticket.title}
                                                                </h4>

                                                                <p className="mt-1 text-sm text-slate-500">
                                                                    {ticket.department} ·{" "}
                                                                    {ticket.requesterName || "Unknown requester"}
                                                                </p>
                                                            </div>

                                                            <ChevronRight className="mt-5 h-5 w-5 shrink-0 text-slate-300" />
                                                        </div>

                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            <span
                                                                className={`rounded-full border px-2.5 py-1 text-xs font-bold ${priorityStyles[ticket.priority] ||
                                                                    priorityStyles.Medium
                                                                    }`}
                                                            >
                                                                {ticket.priority}
                                                            </span>

                                                            <span
                                                                className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyles[ticket.status] || statusStyles.New
                                                                    }`}
                                                            >
                                                                {ticket.status}
                                                            </span>

                                                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-500">
                                                                {ticket.assignedTo || "Unassigned"}
                                                            </span>
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {!selectedTicket ? (
                                            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                                                    Selected ticket
                                                </p>

                                                <h3 className="mt-2 text-2xl font-black text-slate-950">
                                                    No ticket selected
                                                </h3>

                                                <p className="mt-3 text-sm leading-7 text-slate-500">
                                                    Choose a ticket from the list to view its comments, activity
                                                    history, assignment controls, and admin actions.
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                                                                Selected ticket
                                                            </p>

                                                            <h3 className="mt-2 text-2xl font-black text-slate-950">
                                                                {selectedTicket.ticketNumber}
                                                            </h3>

                                                            <p className="mt-2 text-sm leading-7 text-slate-500">
                                                                {selectedTicket.title}
                                                            </p>
                                                        </div>

                                                        <span
                                                            className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyles[selectedTicket.status] || statusStyles.New
                                                                }`}
                                                        >
                                                            {selectedTicket.status}
                                                        </span>
                                                    </div>

                                                    <p className="mt-4 text-sm leading-7 text-slate-500">
                                                        {selectedTicket.description}
                                                    </p>

                                                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                                        <div className="rounded-2xl bg-slate-50 p-4">
                                                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                                                Requester
                                                            </p>
                                                            <p className="mt-1 font-black text-slate-950">
                                                                {selectedTicket.requesterName}
                                                            </p>
                                                        </div>

                                                        <div className="rounded-2xl bg-slate-50 p-4">
                                                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                                                Assigned to
                                                            </p>
                                                            <p className="mt-1 font-black text-slate-950">
                                                                {selectedTicket.assignedTo || "Unassigned"}
                                                            </p>
                                                        </div>

                                                        <div className="rounded-2xl bg-slate-50 p-4">
                                                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                                                Department
                                                            </p>
                                                            <p className="mt-1 font-black text-slate-950">
                                                                {selectedTicket.department}
                                                            </p>
                                                        </div>

                                                        <div className="rounded-2xl bg-slate-50 p-4">
                                                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                                                Priority
                                                            </p>
                                                            <p className="mt-1 font-black text-slate-950">
                                                                {selectedTicket.priority}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                                                            Admin actions
                                                        </p>

                                                        {assignableStatuses.includes(selectedTicket.status) ? (
                                                            <div className="mt-4 grid gap-3">
                                                                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                                                                    <select
                                                                        value={
                                                                            adminAssignByTicket[selectedTicket.id] || ""
                                                                        }
                                                                        onChange={(event) =>
                                                                            setAdminAssignByTicket((previous) => ({
                                                                                ...previous,
                                                                                [selectedTicket.id]: event.target.value,
                                                                            }))
                                                                        }
                                                                        className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 outline-none"
                                                                    >
                                                                        <option value="">
                                                                            Assign to support agent
                                                                        </option>

                                                                        {supportAgents.map((agent) => (
                                                                            <option
                                                                                key={agent.email}
                                                                                value={agent.fullName}
                                                                            >
                                                                                {agent.fullName}
                                                                            </option>
                                                                        ))}
                                                                    </select>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleAdminAssignTicket(selectedTicket)
                                                                        }
                                                                        className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
                                                                    >
                                                                        Assign
                                                                    </button>
                                                                </div>

                                                                <div className="grid gap-2 sm:grid-cols-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleCloseTicket(selectedTicket)
                                                                        }
                                                                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                                                                    >
                                                                        Close ticket
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleCancelTicket(selectedTicket)
                                                                        }
                                                                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-100"
                                                                    >
                                                                        Cancel ticket
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : selectedTicket.status === "Cancelled" ? (
                                                            <div className="mt-4 grid gap-3">
                                                                <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
                                                                    This ticket has been cancelled. You can keep it for audit history or mark it as abandoned if no further action is needed.
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleAbandonTicket(selectedTicket)
                                                                    }
                                                                    className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 hover:bg-amber-100"
                                                                >
                                                                    Mark abandoned
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-500">
                                                                This ticket is no longer active. Assignment, cancellation, and closure actions are disabled.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                                    <h3 className="text-lg font-black text-slate-950">
                                                        Comments
                                                    </h3>

                                                    <div className="mt-4 space-y-3">
                                                        {selectedTicket.comments?.length === 0 ? (
                                                            <p className="text-sm text-slate-500">
                                                                No comments on this ticket.
                                                            </p>
                                                        ) : (
                                                            selectedTicket.comments?.map((comment) => (
                                                                <div
                                                                    key={comment.id}
                                                                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                                                >
                                                                    <p className="font-black text-slate-950">
                                                                        {comment.authorName}
                                                                    </p>

                                                                    <p className="mt-1 text-sm leading-6 text-slate-500">
                                                                        {comment.message}
                                                                    </p>

                                                                    <p className="mt-2 text-xs font-semibold text-slate-400">
                                                                        {new Date(comment.createdAt).toLocaleString()}
                                                                    </p>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                                    <h3 className="text-lg font-black text-slate-950">
                                                        Activity history
                                                    </h3>

                                                    <div className="mt-4 space-y-3">
                                                        {selectedTicket.activityLogs?.length === 0 ? (
                                                            <p className="text-sm text-slate-500">
                                                                No activity history.
                                                            </p>
                                                        ) : (
                                                            selectedTicket.activityLogs?.map((item) => (
                                                                <div
                                                                    key={item.id}
                                                                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                                                >
                                                                    <p className="font-black text-slate-950">
                                                                        {item.action}
                                                                    </p>

                                                                    <p className="mt-1 text-sm text-slate-500">
                                                                        {item.performedBy}
                                                                    </p>

                                                                    {(item.oldValue || item.newValue) && (
                                                                        <p className="mt-1 text-sm text-slate-500">
                                                                            {item.oldValue
                                                                                ? `${item.oldValue} → `
                                                                                : ""}
                                                                            {item.newValue}
                                                                        </p>
                                                                    )}

                                                                    <p className="mt-2 text-xs font-semibold text-slate-400">
                                                                        {new Date(item.createdAt).toLocaleString()}
                                                                    </p>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </motion.section>
                            )}


                            {activeView === "profile" && (
                                <motion.section
                                    key="profile"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                                >
                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                                        Profile
                                    </p>

                                    <h3 className="mt-2 text-2xl font-black text-slate-950">
                                        Account details
                                    </h3>

                                    <p className="mt-3 text-sm leading-7 text-slate-500">
                                        View and update your OpsTrack account name, role,
                                        and active session.
                                    </p>

                                    <form
                                        onSubmit={handleUpdateProfile}
                                        className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-base font-black text-white">
                                                {currentUser?.fullName
                                                    ?.split(" ")
                                                    .map((part) => part[0])
                                                    .join("")
                                                    .slice(0, 2)
                                                    .toUpperCase() || "U"}
                                            </div>

                                            <div>
                                                <p className="text-lg font-black text-slate-950">
                                                    {currentUser?.fullName}
                                                </p>
                                                <p className="text-sm font-semibold text-slate-500">
                                                    {currentUser?.email}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-6">
                                            <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                                Full name
                                            </label>

                                            <input
                                                value={profileName}
                                                onChange={(event) =>
                                                    setProfileName(event.target.value)
                                                }
                                                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-400"
                                                placeholder="Enter your full name"
                                                required
                                            />
                                        </div>

                                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                            <div className="rounded-xl bg-white p-4">
                                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                                    Role
                                                </p>
                                                <p className="mt-1 font-black text-slate-950">
                                                    {currentUser?.role}
                                                </p>
                                            </div>

                                            <div className="rounded-xl bg-white p-4">
                                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                                    Session
                                                </p>
                                                <p className="mt-1 font-black text-emerald-600">
                                                    Active
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                            <button
                                                type="submit"
                                                disabled={profileSaving}
                                                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                                            >
                                                {profileSaving
                                                    ? "Saving..."
                                                    : "Save profile"}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handleLogout}
                                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
                                            >
                                                Sign out
                                            </button>
                                        </div>
                                    </form>
                                </motion.section>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </main>
            <AnimatePresence>
                {cancelTarget && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 px-4 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 18, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 18, scale: 0.96 }}
                            transition={{ type: "spring", damping: 24, stiffness: 260 }}
                            className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
                        >
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-500">
                                Cancel ticket
                            </p>

                            <h3 className="mt-2 text-2xl font-black text-slate-950">
                                Reason required
                            </h3>

                            <p className="mt-3 text-sm leading-7 text-slate-500">
                                You are cancelling{" "}
                                <span className="font-black text-slate-900">
                                    {cancelTarget.ticketNumber}
                                </span>
                                . Add a reason so the audit history explains why the ticket was cancelled.
                            </p>

                            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm font-black text-slate-950">
                                    {cancelTarget.title}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                    {cancelTarget.department} ·{" "}
                                    {cancelTarget.requesterName || "Unknown requester"}
                                </p>
                            </div>

                            <textarea
                                value={cancelReason}
                                onChange={(event) => setCancelReason(event.target.value)}
                                rows={5}
                                placeholder="Example: Requester confirmed this was logged by mistake."
                                className="mt-5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                            />

                            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCancelTarget(null);
                                        setCancelReason("");
                                    }}
                                    disabled={cancellingTicket}
                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                                >
                                    Keep ticket open
                                </button>

                                <button
                                    type="button"
                                    onClick={confirmCancelTicket}
                                    disabled={cancellingTicket}
                                    className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                                >
                                    {cancellingTicket ? "Cancelling..." : "Confirm cancellation"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
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
                                    <p className="text-sm font-semibold text-slate-500">
                                        Create
                                    </p>
                                    <h3 className="text-2xl font-black">
                                        New support ticket
                                    </h3>
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
                                        setNewTicket({
                                            ...newTicket,
                                            title: event.target.value,
                                        })
                                    }
                                    className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                                    placeholder="Ticket title"
                                    required
                                />

                                <input
                                    value={newTicket.category}
                                    onChange={(event) =>
                                        setNewTicket({
                                            ...newTicket,
                                            category: event.target.value,
                                        })
                                    }
                                    className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
                                    placeholder="Category"
                                    required
                                />

                                <select
                                    value={newTicket.priority}
                                    onChange={(event) =>
                                        setNewTicket({
                                            ...newTicket,
                                            priority: event.target.value,
                                        })
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

            <AnimatePresence>
                {cancelTarget && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 px-4 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 18, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 18, scale: 0.96 }}
                            transition={{ type: "spring", damping: 24, stiffness: 260 }}
                            className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
                        >
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-500">
                                Cancel ticket
                            </p>

                            <h3 className="mt-2 text-2xl font-black text-slate-950">
                                Reason required
                            </h3>

                            <p className="mt-3 text-sm leading-7 text-slate-500">
                                You are cancelling{" "}
                                <span className="font-black text-slate-900">
                                    {cancelTarget.ticketNumber}
                                </span>
                                . Add a clear reason so the audit trail explains why this ticket was cancelled.
                            </p>

                            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm font-black text-slate-950">
                                    {cancelTarget.title}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                    {cancelTarget.department} ·{" "}
                                    {cancelTarget.requesterName || "Unknown requester"}
                                </p>
                            </div>

                            <label className="mt-5 block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                Cancellation reason
                            </label>

                            <textarea
                                value={cancelReason}
                                onChange={(event) => setCancelReason(event.target.value)}
                                rows={5}
                                placeholder="Example: Requester confirmed the ticket was logged by mistake."
                                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                            />

                            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCancelTarget(null);
                                        setCancelReason("");
                                    }}
                                    disabled={cancellingTicket}
                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                                >
                                    Keep ticket open
                                </button>

                                <button
                                    type="button"
                                    onClick={confirmCancelTicket}
                                    disabled={cancellingTicket || !cancelReason.trim()}
                                    className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {cancellingTicket ? "Cancelling..." : "Confirm cancellation"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}