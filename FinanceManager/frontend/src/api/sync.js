const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
export async function syncGmailTransactions() {
    try {
        const response = await fetch(`${API_BASE_URL}/finance/sync/gmail`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Sync failed');
        }
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error('Error syncing Gmail transactions:', error);
        throw error;
    }
}
export async function getLastSyncTime() {
    try {
        const lastSync = localStorage.getItem('lastSyncTime');
        return lastSync;
    }
    catch (error) {
        console.error('Error getting last sync time:', error);
        return null;
    }
}
export function setLastSyncTime() {
    const now = new Date().toISOString();
    localStorage.setItem('lastSyncTime', now);
    return now;
}
export async function getSyncStatus() {
    const res = await fetch(`${API_BASE_URL}/finance/sync/status`, {
        credentials: 'include',
    });
    if (!res.ok)
        throw new Error('Failed to get sync status');
    return res.json();
}
