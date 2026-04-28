// ============================================================================
// CANTEEN MANAGEMENT SYSTEM - API WRAPPER
// ============================================================================

const CanteenAPI = {
    async _fetch(url, options) {
        const r = await fetch(url, options);
        if (!r.ok) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
        return r.json();
    },

    async getSummary() {
        return this._fetch('/api/summary');
    },

    async getEmployees() {
        return this._fetch('/api/employees');
    },

    async updateEmployee(nationality, count) {
        return this._fetch('/api/employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nationality, count })
        });
    },

    async getItems(nationality = 'all') {
        return this._fetch(`/api/items?nationality=${nationality}`);
    },

    async getComparison() {
        return this._fetch('/api/comparison');
    },

    async getPerHead(nationality = 'all', category = 'all') {
        return this._fetch(`/api/perhead?nationality=${nationality}&category=${category}`);
    },

    async getTrends(nationality = 'all') {
        return this._fetch(`/api/trends?nationality=${nationality}`);
    },

    async getReport(type) {
        return this._fetch(`/api/report/${type}`);
    },

    async uploadFile(formData) {
        const r = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!r.ok) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
        return r.json();
    }
};
