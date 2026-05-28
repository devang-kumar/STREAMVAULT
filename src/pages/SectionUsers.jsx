import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, Shield, Trash2, RefreshCw, UserX, UserCheck,
  Mail, Calendar, Crown, AlertCircle, ChevronDown, MoreVertical,
  Filter, Download, Eye
} from 'lucide-react';
import { adminGetUsers, adminDeleteUser, adminUpdateUserRole } from '../api/client';
import { Badge } from '../components/admin/ui';

function UserRow({ user, onDelete, onRoleChange }) {
  const [showActions, setShowActions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const planColors = {
    premium: { bg: 'rgba(245,197,24,0.12)', color: '#f5c518', label: 'Premium' },
    free: { bg: 'var(--bg-elevated)', color: 'var(--text-muted)', label: 'Free' },
    pro: { bg: 'var(--blue-dim)', color: '#3b82f6', label: 'Pro' },
  };
  const plan = planColors[user.plan?.toLowerCase()] || planColors.free;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 160px 100px 100px 80px',
      alignItems: 'center',
      gap: 12,
      padding: '14px 18px',
      borderBottom: '1px solid var(--border)',
      transition: 'background 0.15s ease',
      position: 'relative',
    }}
      className="user-row"
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; setShowActions(false); }}
    >
      {/* User Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: user.avatar ? 'none' : 'var(--accent-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, overflow: 'hidden',
          border: '2px solid var(--border)',
        }}>
          {user.avatar ? (
            <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Users size={16} color="var(--accent)" />
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {user.name || 'Unknown'}
            {user.role === 'admin' && (
              <Shield size={12} color="var(--accent)" />
            )}
          </div>
          <div style={{
            fontSize: 11, color: 'var(--text-muted)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {user.email}
          </div>
        </div>
      </div>

      {/* Plan */}
      <div>
        <span style={{
          background: plan.bg, color: plan.color,
          padding: '3px 10px', borderRadius: 99,
          fontSize: 11, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          {user.plan?.toLowerCase() === 'premium' && <Crown size={10} />}
          {plan.label}
        </span>
      </div>

      {/* Role */}
      <div>
        <span style={{
          background: user.role === 'admin' ? 'rgba(245,197,24,0.12)' : 'var(--bg-elevated)',
          color: user.role === 'admin' ? '#f5c518' : 'var(--text-secondary)',
          padding: '3px 10px', borderRadius: 99,
          fontSize: 11, fontWeight: 600,
          textTransform: 'capitalize',
        }}>
          {user.role || 'user'}
        </span>
      </div>

      {/* Joined */}
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
        <button
          onClick={() => onRoleChange(user.id, user.role === 'admin' ? 'user' : 'admin')}
          title={user.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
          style={{
            width: 30, height: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', borderRadius: 'var(--radius-sm)',
            color: 'var(--text-muted)', cursor: 'pointer',
            border: 'none', outline: 'none',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-subtle)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          {user.role === 'admin' ? <UserX size={14} /> : <UserCheck size={14} />}
        </button>
        <button
          onClick={() => {
            if (confirmDelete) {
              onDelete(user.id);
              setConfirmDelete(false);
            } else {
              setConfirmDelete(true);
              setTimeout(() => setConfirmDelete(false), 3000);
            }
          }}
          title={confirmDelete ? 'Click again to confirm' : 'Delete user'}
          style={{
            width: 30, height: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: confirmDelete ? 'var(--red-dim)' : 'none',
            borderRadius: 'var(--radius-sm)',
            color: confirmDelete ? 'var(--red)' : 'var(--text-muted)',
            cursor: 'pointer',
            border: 'none', outline: 'none',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => { if (!confirmDelete) { e.currentTarget.style.background = 'var(--red-dim)'; e.currentTarget.style.color = 'var(--red)'; } }}
          onMouseLeave={(e) => { if (!confirmDelete) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default function SectionUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminGetUsers();
      setUsers(Array.isArray(data) ? data : (data?.users || data?.data || []));
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (userId) => {
    try {
      await adminDeleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Failed to delete user: ' + (err.message || 'Unknown error'));
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminUpdateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error('Failed to update role:', err);
      alert('Failed to update role: ' + (err.message || 'Unknown error'));
    }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchPlan = filterPlan === 'all' || u.plan?.toLowerCase() === filterPlan;
    return matchSearch && matchRole && matchPlan;
  });

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    premium: users.filter(u => u.plan?.toLowerCase() === 'premium').length,
    free: users.filter(u => u.plan?.toLowerCase() !== 'premium').length,
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 400, flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--accent)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading users...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 28,
          letterSpacing: '0.06em', marginBottom: 4,
        }}>
          USER <span style={{ color: 'var(--accent)' }}>MANAGEMENT</span>
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Manage user accounts, roles, and subscriptions
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12, marginBottom: 24,
      }}>
        {[
          { label: 'Total Users', value: stats.total, color: 'var(--accent)' },
          { label: 'Admins', value: stats.admins, color: '#3b82f6' },
          { label: 'Premium', value: stats.premium, color: '#22c55e' },
          { label: 'Free', value: stats.free, color: 'var(--text-muted)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '16px 18px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              {s.label}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color: s.color, marginTop: 4 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap',
      }}>
        <div style={{
          flex: 1, minWidth: 200, maxWidth: 360,
          position: 'relative',
        }}>
          <Search size={14} style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
          }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            style={{
              paddingLeft: 36, fontSize: 12,
              height: 38,
            }}
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          style={{ width: 'auto', minWidth: 120, height: 38, fontSize: 12 }}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          style={{ width: 'auto', minWidth: 120, height: 38, fontSize: 12 }}
        >
          <option value="all">All Plans</option>
          <option value="premium">Premium</option>
          <option value="free">Free</option>
        </select>
        <button
          onClick={fetchUsers}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-secondary)',
            fontSize: 12, fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 16px',
          background: 'var(--red-dim)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 'var(--radius)',
          marginBottom: 16,
          fontSize: 12, color: 'var(--red)',
        }}>
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="table-scroll-container" style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        {/* Table Header */}
        <div style={{
          minWidth: 700,
          display: 'grid',
          gridTemplateColumns: '1fr 160px 100px 100px 80px',
          alignItems: 'center',
          gap: 12,
          padding: '12px 18px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-elevated)',
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          <span>User</span>
          <span>Plan</span>
          <span>Role</span>
          <span>Joined</span>
          <span style={{ textAlign: 'right' }}>Actions</span>
        </div>

        {/* Table Body */}
        {filteredUsers.length === 0 ? (
          <div style={{
            padding: '60px 20px', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <Users size={32} color="var(--text-muted)" />
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {search || filterRole !== 'all' || filterPlan !== 'all' ? 'No matching users' : 'No users yet'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {search || filterRole !== 'all' || filterPlan !== 'all'
                ? 'Try adjusting your filters'
                : 'Users will appear here once they register'}
            </div>
          </div>
        ) : (
          filteredUsers.map(user => (
            <UserRow
              key={user.id || user._id}
              user={user}
              onDelete={handleDelete}
              onRoleChange={handleRoleChange}
            />
          ))
        )}
      </div>

      {/* Footer count */}
      <div style={{
        marginTop: 12, fontSize: 11, color: 'var(--text-muted)',
        textAlign: 'center',
      }}>
        Showing {filteredUsers.length} of {users.length} users
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .user-row {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
        }
      `}</style>
    </div>
  );
}