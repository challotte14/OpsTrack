const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://opstrack.runasp.net/api";

function getToken() {
    return localStorage.getItem("opstrack_token");
}

async function request(endpoint, options = {}) {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
        ...options,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Request failed");
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

export function registerUser(payload) {
    return request("/Auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function loginUser(payload) {
    return request("/Auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function getCurrentUser() {
    return request("/Auth/me");
}

export function updateCurrentUserProfile(payload) {
    return request("/Auth/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export function getSupportAgents() {
    return request("/Auth/support-agents");
}

export function saveToken(token) {
    localStorage.setItem("opstrack_token", token);
}

export function removeToken() {
    localStorage.removeItem("opstrack_token");
}

export function getDashboardSummary() {
    return request("/Dashboard/summary");
}

export function getTickets(filters = {}) {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "All") {
            params.append(key, value);
        }
    });

    const query = params.toString();

    return request(`/Tickets${query ? `?${query}` : ""}`);
}

export function getTicket(id) {
    return request(`/Tickets/${id}`);
}

export function createTicket(ticket) {
    return request("/Tickets", {
        method: "POST",
        body: JSON.stringify(ticket),
    });
}

export function updateTicketStatus(id, payload) {
    return request(`/Tickets/${id}/status`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function assignTicket(id, payload) {
    return request(`/Tickets/${id}/assign`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function addTicketComment(id, payload) {
    return request(`/Tickets/${id}/comments`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function cancelTicketWithReason(id, payload) {
    await updateTicketStatus(id, {
        status: "Cancelled",
        performedBy: payload.performedBy,
    });

    return addTicketComment(id, {
        authorName: payload.performedBy,
        message: `Cancellation reason: ${payload.reason}`,
    });
}

export async function abandonTicket(id, payload) {
    await updateTicketStatus(id, {
        status: "Abandoned",
        performedBy: payload.performedBy,
    });

    if (payload.reason) {
        return addTicketComment(id, {
            authorName: payload.performedBy,
            message: `Abandonment reason: ${payload.reason}`,
        });
    }

    return null;
}

export function getNotifications() {
    return request("/Notifications");
}

export function getUnreadNotificationCount() {
    return request("/Notifications/unread-count");
}

export function markNotificationAsRead(id) {
    return request(`/Notifications/${id}/read`, {
        method: "POST",
    });
}

export function markAllNotificationsAsRead() {
    return request("/Notifications/mark-all-read", {
        method: "POST",
    });
}
