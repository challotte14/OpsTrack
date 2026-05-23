const API_BASE_URL = "https://localhost:7206/api";

async function request(endpoint, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            "Content-Type": "application/json",
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