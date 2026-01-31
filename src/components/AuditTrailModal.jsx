import React, { useEffect, useState } from 'react';
import { X, Clock, Shield, Globe, User, FileText } from 'lucide-react';
import { auditService } from '../services/auditService';

const AuditTrailModal = ({ isOpen, onClose, envelope }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && envelope) {
            fetchLogs();
        }
    }, [isOpen, envelope]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await auditService.fetchLogs(envelope.id);
            setLogs(data);
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-[scaleIn_0.3s_ease-out]">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-2xl font-['Crimson_Pro'] font-bold text-gray-900 flex items-center gap-2">
                            <Shield className="text-green-600" size={24} />
                            Audit Trail
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Legal evidence log for envelope <span className="font-mono font-medium text-gray-700">#{envelope?.id?.slice(0, 8)}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mb-4"></div>
                            <p>Loading history...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <FileText size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No activity recorded yet.</p>
                        </div>
                    ) : (
                        <div className="relative pl-8 border-l-2 border-gray-200 space-y-8">
                            {logs.map((log, index) => (
                                <div key={log.id} className="relative group">
                                    {/* Timeline Dot */}
                                    <div className={`absolute -left-[41px] top-0 w-5 h-5 rounded-full border-4 border-white shadow-sm flex items-center justify-center
                                        ${log.action === 'COMPLETED' ? 'bg-green-500' :
                                            log.action === 'SIGNED' ? 'bg-blue-500' :
                                                log.action === 'VIEWED' ? 'bg-yellow-500' :
                                                    'bg-gray-400'
                                        }`}
                                    />

                                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 group-hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase tracking-wider mb-2
                                                    ${log.action === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                        log.action === 'SIGNED' ? 'bg-blue-100 text-blue-700' :
                                                            log.action === 'VIEWED' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-gray-100 text-gray-700'
                                                    }`}
                                                >
                                                    {log.action}
                                                </span>
                                            </div>
                                            <div className="flex items-center text-xs text-gray-400 gap-1" title={new Date(log.created_at).toLocaleString()}>
                                                <Clock size={12} />
                                                {new Date(log.created_at).toLocaleString()}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                                                <User size={14} className="text-gray-400" />
                                                {log.actor_name || 'Unknown User'}
                                                {log.actor_email && <span className="text-gray-400 font-normal">&lt;{log.actor_email}&gt;</span>}
                                            </div>
                                            {log.ip_address && (
                                                <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                                                    <Globe size={12} className="text-gray-400" />
                                                    IP: {log.ip_address}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">
                        Secure Audit Logging Enabled
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuditTrailModal;
