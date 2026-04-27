// ============================================================================
// CANTEEN MANAGEMENT SYSTEM — API UTILITIES
// Handles communication with a backend API when available.
// Falls back gracefully to localStorage-only (offline) mode.
// ============================================================================

const API_BASE_URL = 'http://localhost:3000/api';

// Check if the backend API is reachable
async function checkAPIHealth() {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            signal: controller.signal
        });
        clearTimeout(timeout);
        return response.ok;
    } catch {
        return false;
    }
}

// Upload a file to the backend (falls back silently if unavailable)
async function uploadFile(file) {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result = await response.json();
        console.log('✅ File uploaded to backend:', result);
        return result;
    } catch (error) {
        console.warn('⚠️  Backend upload unavailable — using offline mode:', error.message);
        return { success: true, offline: true, message: 'Stored locally' };
    }
}

// Fetch employee counts from backend (optional sync)
async function fetchEmployeeCounts() {
    try {
        const response = await fetch(`${API_BASE_URL}/employees`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch {
        return null;
    }
}

// Push current state to backend for persistence
async function pushStateToBackend(stateData) {
    try {
        const response = await fetch(`${API_BASE_URL}/state`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(stateData)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch {
        return null;
    }
}

// Attempt to sync with the backend.
// Called after save operations — silently skips if API is down.
async function syncWithBackend() {
    if (!navigator.onLine) {
        console.log('📴 Offline — data saved to localStorage only');
        return;
    }

    const isHealthy = await checkAPIHealth();
    if (isHealthy) {
        console.log('✅ Connected to backend API');
        // Future: push state, fetch latest data, etc.
    } else {
        console.log('⚠️  API unavailable — offline mode active');
    }
}

// Export for use by main.js
window.checkAPIHealth   = checkAPIHealth;
window.uploadFile       = uploadFile;
window.fetchEmployeeCounts = fetchEmployeeCounts;
window.pushStateToBackend  = pushStateToBackend;
window.syncWithBackend  = syncWithBackend;
