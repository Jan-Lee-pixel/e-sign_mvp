/**
 * Service for logging audit events to the backend.
 * All logs are sent to the server to capture reliable IP addresses.
 */

const API_URL = 'http://localhost:4242';

export const auditService = {
    /**
     * Log an event to the audit trail.
     * @param {string} envelopeId - The UUID of the envelope/document.
     * @param {string} action - 'CREATED', 'VIEWED', 'SIGNED', 'COMPLETED', 'VOIDED'
     * @param {object} actor - { name: string, email: string }
     */
    logEvent: async (envelopeId, action, actor = {}) => {
        try {
            await fetch(`${API_URL}/audit-log`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    envelopeId,
                    action,
                    actorName: actor.name || 'Guest',
                    actorEmail: actor.email || null
                }),
            });
        } catch (error) {
            // We generally don't want to block the user if logging fails, but we should record it.
            console.error('[Audit] Failed to log event:', error);
        }
    },

    /**
     * Fetch logs for a specific envelope.
     * Can be used if RLS fails or simpler proxy needed.
     */
    fetchLogs: async (envelopeId) => {
        try {
            const res = await fetch(`${API_URL}/audit-logs/${envelopeId}`);
            if (!res.ok) throw new Error('Failed to fetch logs');
            return await res.json();
        } catch (error) {
            console.error('[Audit] Failed to fetch logs:', error);
            return [];
        }
    }
};
