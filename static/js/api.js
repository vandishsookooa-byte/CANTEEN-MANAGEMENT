// ============================================================================
// CANTEEN MANAGEMENT SYSTEM - API WRAPPER
// ============================================================================

const CanteenAPI = {
    async getSummary() {
        const r = await fetch('/api/summary');
        return r.json();
    },

    async getEmployees() {
        const r = await fetch('/api/employees');
        return r.json();
    },

    async updateEmployee(nationality, count) {
        const r = await fetch('/api/employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nationality, count })
        });
        return r.json();
    },

    async getItems(nationality = 'all') {
        const r = await fetch(`/api/items?nationality=${nationality}`);
        return r.json();
    },

    async getComparison() {
        const r = await fetch('/api/comparison');
        return r.json();
    },

    async getPerHead(nationality = 'all', category = 'all') {
        const r = await fetch(`/api/perhead?nationality=${nationality}&category=${category}`);
        return r.json();
    },

    async getTrends(nationality = 'all') {
        const r = await fetch(`/api/trends?nationality=${nationality}`);
        return r.json();
    },

    async getReport(type) {
        const r = await fetch(`/api/report/${type}`);
        return r.json();
    },

    async uploadFile(formData) {
        const r = await fetch('/api/upload', { method: 'POST', body: formData });
        return r.json();
    }
};
