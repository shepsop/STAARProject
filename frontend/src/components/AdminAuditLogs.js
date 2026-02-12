import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/AdminDashboard.css';

const API_URL = process.env.REACT_APP_API_URL || '';

function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/admin/audit-logs?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();
      setLogs(data);
    } catch (err) {
      setError('Failed to load audit logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    const icons = {
      'password_reset': '🔑',
      'grant_admin': '👑',
      'user_created': '✨',
      'user_deleted': '🗑️',
    };
    return icons[action] || '📝';
  };

  return (
    <motion.div
      className="audit-logs"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="audit-header">
        <button onClick={fetchAuditLogs} className="refresh-button">
          🔄 Refresh Logs
        </button>
      </div>

      {error && (
        <motion.div
          className="admin-error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          ❌ {error}
        </motion.div>
      )}

      <div className="logs-list-section">
        {loading ? (
          <div className="loading">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="no-logs">No audit logs found</div>
        ) : (
          <motion.div className="logs-list">
            <AnimatePresence>
              {logs.map((log, index) => (
                <motion.div
                  key={log.id}
                  className="log-entry"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="log-icon">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="log-content">
                    <div className="log-action">
                      <strong>{log.action.replace(/_/g, ' ').toUpperCase()}</strong>
                    </div>
                    <div className="log-details">
                      <p>Target User: <code>{log.target_user}</code></p>
                      {log.details && (
                        <p>Details: {JSON.stringify(log.details)}</p>
                      )}
                    </div>
                    <div className="log-meta">
                      <small>{new Date(log.timestamp).toLocaleString()}</small>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default AdminAuditLogs;
