import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import UserManagement from './UserManagement';
import AdminAuditLogs from './AdminAuditLogs';
import '../styles/AdminDashboard.css';

const API_URL = process.env.REACT_APP_API_URL || '';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    checkAdminStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/check`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 403) {
        setError('You do not have admin privileges');
        setIsAdmin(false);
      } else if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.is_admin);
      }
    } catch (err) {
      setError('Failed to check admin status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading admin panel...</div>;
  }

  if (!isAdmin) {
    return (
      <motion.div
        className="admin-unauthorized"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h2>❌ Unauthorized</h2>
        <p>{error || 'You do not have admin access.'}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="admin-dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="admin-header">
        <h1>🔐 Admin Dashboard</h1>
        <p>Manage users and system operations</p>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 User Management
        </button>
        <button
          className={`tab-button ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          📋 Audit Logs
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'audit' && <AdminAuditLogs />}
      </div>
    </motion.div>
  );
}

export default AdminDashboard;
