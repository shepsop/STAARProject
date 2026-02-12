import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/AdminDashboard.css';

const API_URL = process.env.REACT_APP_API_URL || '';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/admin/users?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectUser = async (username) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/user/${username}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }

      const data = await response.json();
      setSelectedUser(data);
      setResetPassword('');
      setResetSuccess('');
    } catch (err) {
      setError('Failed to load user details');
      console.error(err);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPassword) {
      setError('Please enter a new password');
      return;
    }

    setResetLoading(true);
    setError('');
    setResetSuccess('');

    try {
      const response = await fetch(`${API_URL}/api/admin/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: selectedUser.username,
          new_password: resetPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to reset password');
        return;
      }

      setResetSuccess(`✓ Password reset successfully for ${selectedUser.username}`);
      setResetPassword('');
      setTimeout(() => {
        setSelectedUser(null);
        setResetSuccess('');
      }, 2000);
    } catch (err) {
      setError('Network error while resetting password');
      console.error(err);
    } finally {
      setResetLoading(false);
    }
  };

  const handleGrantAdmin = async (username) => {
    if (!window.confirm(`Grant admin privileges to ${username}?`)) {
      return;
    }

    setError('');
    try {
      const response = await fetch(`${API_URL}/api/admin/make-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to grant admin privileges');
        return;
      }

      setResetSuccess(`✓ Admin privileges granted to ${username}`);
      fetchUsers();
      setTimeout(() => setResetSuccess(''), 2000);
    } catch (err) {
      setError('Failed to grant admin privileges');
      console.error(err);
    }
  };

  return (
    <motion.div
      className="user-management"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="user-search-section">
        <input
          type="text"
          placeholder="Search users by username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <button onClick={fetchUsers} className="refresh-button">
          🔄 Refresh
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

      {resetSuccess && (
        <motion.div
          className="admin-success"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {resetSuccess}
        </motion.div>
      )}

      <div className="users-list-section">
        {loading ? (
          <div className="loading">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="no-users">No users found</div>
        ) : (
          <motion.div className="users-list">
            <AnimatePresence>
              {filteredUsers.map((user, index) => (
                <motion.div
                  key={user.user_id}
                  className={`user-card ${selectedUser?.user_id === user.user_id ? 'selected' : ''}`}
                  onClick={() => handleSelectUser(user.username)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="user-info">
                    <h3>👤 {user.username}</h3>
                    <p>Level {user.current_level} • {user.total_points} points</p>
                    <small>Joined: {new Date(user.created_at).toLocaleDateString()}</small>
                  </div>
                  <div className="user-actions">
                    <button
                      className="select-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectUser(user.username);
                      }}
                    >
                      Select
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {selectedUser && (
          <motion.div
            className="user-details-panel"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="panel-header">
              <h3>User Details: {selectedUser.username}</h3>
              <button
                className="close-button"
                onClick={() => setSelectedUser(null)}
              >
                ✕
              </button>
            </div>

            <div className="panel-content">
              <div className="user-details">
                <p><strong>User ID:</strong> {selectedUser.user_id}</p>
                <p><strong>Created:</strong> {new Date(selectedUser.created_at).toLocaleDateString()}</p>
                <p><strong>Admin Status:</strong> {selectedUser.is_admin ? '✓ Admin' : '○ Regular User'}</p>
              </div>

              <div className="user-progress">
                <h4>Progress Stats</h4>
                <p>Level: {selectedUser.progress.current_level}</p>
                <p>Total Points: {selectedUser.progress.total_points}</p>
                <p>Questions Answered: {selectedUser.progress.questions_answered}</p>
                <p>Correct Answers: {selectedUser.progress.correct_answers}</p>
              </div>

              <form onSubmit={handleResetPassword} className="reset-password-form">
                <h4>Reset Password</h4>
                <div className="form-group">
                  <label htmlFor="new-password">New Password:</label>
                  <input
                    id="new-password"
                    type="password"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="Enter new password (min 4 characters)"
                    disabled={resetLoading}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="reset-button"
                  disabled={resetLoading}
                >
                  {resetLoading ? 'Resetting...' : '🔑 Reset Password'}
                </button>
              </form>

              {!selectedUser.is_admin && (
                <button
                  className="grant-admin-button"
                  onClick={() => handleGrantAdmin(selectedUser.username)}
                >
                  👑 Grant Admin Privileges
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default UserManagement;
