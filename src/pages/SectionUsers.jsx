import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, Shield, Trash2, RefreshCw, UserX, UserCheck,
  Mail, Calendar, Crown, AlertCircle, ChevronLeft, ChevronRight,
  Filter, Eye, X, Loader2, Check, Ban, Clock, UserPlus
} from 'lucide-react';
import {
  adminGetUsers, adminDeleteUser, adminUpdateUserRole,
  adminSuspendUser, adminReactivateUser, adminGetUser
} from '../api/client';

// ── User Detail Drawer ──
function UserDetailDrawer({ userId, onClose }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    const fetchUser = async () => {
      try {
        setLoading(true);
        const data = await adminGetUser(userId);
        setUser(data);
      } catch (err) {
        setError(err.message || 'Failed to load user details');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  if (!userId) return null;

  const planStatus = user?.subscription?.status || 'Basic';
  const isPremium = planStatus === 'Premium';
  const expiryDate = user?.subscription?.expiryDate
    ? new Date(user.subscription.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'N/A';

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md bg-[#0D0D14] border-l border-[#1E1E2E] overflow-y-auto"
        style={{ animation: 'slideIn 0.2s ease forwards' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E1E2E]">
          <h3 className="font-display text-lg text-white">User Details</h3>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[#D4A017]" />
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <AlertCircle size={24} className="text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : user ? (
          <div className="p-6 space-y-6">
            {/* Avatar + Name */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#1E1E2E] flex-shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#D4A017]/10 flex items-center justify-center">
                    <Users size={24} className="text-[#D4A017]" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">{user.name}</h2>
                  {user.role === 'admin' && <Shield size={14} className="text-[#D4A017]" />}
                </div>
                <p className="text-sm text-gray-400">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    user.isActive !== false ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {user.isActive !== false ? 'Active' : 'Suspended'}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    isPremium ? 'bg-yellow-500/10 text-yellow-400' : 'bg-gray-500/10 text-gray-400'
                  }`}>
                    {isPremium && <Crown size={8} className="inline mr-0.5" />}
                    {planStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-4 space-y-3">
              <h4 className="text-xs text-gray-500 font-medium uppercase tracking-wider">Account Details</h4>
              {[
                { label: 'Name', value: user.name },
                { label: 'Email', value: user.email },
                { label: 'Role', value: user.role || 'user' },
                { label: 'Account Status', value: user.isActive !== false ? 'Active' : 'Suspended', color: user.isActive !== false ? 'text-green-400' : 'text-red-400' },
                { label: 'Registered', value: user.since || 'N/A' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{item.label}</span>
                  <span className={`text-sm text-white ${item.color || ''}`}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* Subscription */}
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-4 space-y-3">
              <h4 className="text-xs text-gray-500 font-medium uppercase tracking-wider">Subscription</h4>
              {[
                { label: 'Plan', value: planStatus },
                { label: 'Plan ID', value: user.subscription?.planId || 'N/A' },
                { label: 'Expiry', value: expiryDate },
                { label: 'Status', value: isPremium ? 'Premium' : 'Free', color: isPremium ? 'text-yellow-400' : 'text-gray-400' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{item.label}</span>
                  <span className={`text-sm ${item.color || 'text-white'}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// ── User Table Row ──
function UserRow({ user, onSuspend, onReactivate, onRoleChange, onDelete, onViewDetail }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState(false);

  const isSuspended = user.isActive === false;
  const isPremium = user.plan?.toLowerCase() === 'premium';

  return (
    <div className="grid grid-cols-[1.5fr_120px_80px_100px_80px_100px] gap-3 px-4 py-3 border-b border-[#1E1E2E]/50 last:border-0 items-center hover:bg-white/[0.02] transition-colors user-row">
      {/* User Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#1E1E2E] flex-shrink-0">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#D4A017]/10 flex items-center justify-center">
              <Users size={14} className="text-[#D4A017]" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-white truncate">{user.name || 'Unknown'}</p>
            {user.role === 'admin' && <Shield size={10} className="text-[#D4A017] flex-shrink-0" />}
          </div>
          <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
        </div>
      </div>

      {/* Plan */}
      <div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
          isPremium ? 'bg-yellow-500/10 text-yellow-400' : 'bg-gray-500/10 text-gray-400'
        }`}>
          {isPremium && <Crown size={8} className="inline mr-0.5" />}
          {user.plan || 'Basic'}
        </span>
      </div>

      {/* Role */}
      <div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
          user.role === 'admin' ? 'bg-[#D4A017]/10 text-[#D4A017]' : 'bg-gray-500/10 text-gray-400'
        }`}>
          {user.role || 'user'}
        </span>
      </div>

      {/* Joined */}
      <span className="text-[10px] text-gray-500">{user.since || 'N/A'}</span>

      {/* Status */}
      <div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
          isSuspended ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
        }`}>
          {isSuspended ? 'Suspended' : 'Active'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 justify-end">
        <button
          onClick={() => onViewDetail(user.id || user._id)}
          className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
          title="View details"
        >
          <Eye size={13} />
        </button>

        <button
          onClick={() => {
            if (user.role === 'admin') {
              onRoleChange(user.id, 'user');
            } else {
              onRoleChange(user.id, 'admin');
            }
          }}
          title={user.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
          className="p-1.5 text-gray-500 hover:text-[#D4A017] hover:bg-[#D4A017]/10 rounded-lg transition-colors"
        >
          {user.role === 'admin' ? <UserX size={13} /> : <UserCheck size={13} />}
        </button>

        {isSuspended ? (
          <button
            onClick={() => onReactivate(user.id)}
            className="p-1.5 text-gray-500 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
            title="Reactivate user"
          >
            <UserCheck size={13} />
          </button>
        ) : (
          <button
            onClick={() => {
              if (confirmSuspend) {
                onSuspend(user.id);
                setConfirmSuspend(false);
              } else {
                setConfirmSuspend(true);
                setTimeout(() => setConfirmSuspend(false), 3000);
              }
            }}
            title={confirmSuspend ? 'Click to confirm suspension' : 'Suspend user'}
            className={`p-1.5 rounded-lg transition-colors ${
              confirmSuspend ? 'text-red-400 bg-red-500/20' : 'text-gray-500 hover:text-orange-400 hover:bg-orange-400/10'
            }`}
          >
            <Ban size={13} />
          </button>
        )}

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
          title={confirmDelete ? 'Click again to confirm delete' : 'Delete user'}
          className={`p-1.5 rounded-lg transition-colors ${
            confirmDelete ? 'text-red-400 bg-red-500/20' : 'text-gray-500 hover:text-red-400 hover:bg-red-400/10'
          }`}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Main SectionUsers Component ──
export default function SectionUsers() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, premiumUsers: 0, freeUsers: 0, newUsers: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewingUserId, setViewingUserId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const fetchUsers = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminGetUsers({
        page: params.page || pagination.page,
        limit: 50,
        q: params.q !== undefined ? params.q : search,
        role: params.role !== undefined ? params.role : filterRole,
        plan: params.plan !== undefined ? params.plan : filterPlan,
        status: params.status !== undefined ? params.status : filterStatus,
      });
      setUsers(res.users || []);
      setStats(res.stats || { totalUsers: 0, activeUsers: 0, premiumUsers: 0, freeUsers: 0, newUsers: 0 });
      setPagination(res.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, filterRole, filterPlan, filterStatus, pagination.page]);

  useEffect(() => {
    fetchUsers({ page: 1 });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers({ page: 1, q: search });
    }, 300);
    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter changes trigger refetch
  useEffect(() => {
    fetchUsers({ page: 1 });
  }, [filterRole, filterPlan, filterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSuspend = async (userId) => {
    try {
      await adminSuspendUser(userId);
      showMessage('success', 'User suspended successfully');
      await fetchUsers();
    } catch (err) {
      showMessage('error', err.message || 'Failed to suspend user');
    }
  };

  const handleReactivate = async (userId) => {
    try {
      await adminReactivateUser(userId);
      showMessage('success', 'User reactivated successfully');
      await fetchUsers();
    } catch (err) {
      showMessage('error', err.message || 'Failed to reactivate user');
    }
  };

  const handleDelete = async (userId) => {
    try {
      await adminDeleteUser(userId);
      showMessage('success', 'User deleted successfully');
      await fetchUsers();
    } catch (err) {
      showMessage('error', err.message || 'Failed to delete user');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminUpdateUserRole(userId, newRole);
      showMessage('success', `User role updated to ${newRole}`);
      await fetchUsers();
    } catch (err) {
      showMessage('error', err.message || 'Failed to update role');
    }
  };

  const handlePageChange = (newPage) => {
    fetchUsers({ page: newPage });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl text-white mb-1">User Management</h1>
        <p className="text-xs text-gray-500">Manage user accounts, roles, and subscriptions</p>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`mb-4 flex items-center gap-2 text-sm rounded-lg px-4 py-2 ${
          message.type === 'success'
            ? 'bg-green-500/10 border border-green-500/30 text-green-300'
            : 'bg-red-500/10 border border-red-500/30 text-red-300'
        }`}>
          {message.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
          {message.text}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total Users', value: stats.totalUsers, color: 'text-[#D4A017]', icon: Users },
          { label: 'Active', value: stats.activeUsers, color: 'text-green-400', icon: UserCheck },
          { label: 'Premium', value: stats.premiumUsers, color: 'text-yellow-400', icon: Crown },
          { label: 'Free', value: stats.freeUsers, color: 'text-gray-400', icon: Users },
          { label: 'New (Month)', value: stats.newUsers, color: 'text-blue-400', icon: UserPlus },
        ].map(card => (
          <div key={card.label} className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <card.icon size={14} className={card.color} />
              <p className="text-[10px] text-gray-500 font-medium">{card.label}</p>
            </div>
            <p className="text-xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-[#111118] border border-[#1E1E2E] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4A017]/50 transition-colors"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="bg-[#111118] border border-[#1E1E2E] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4A017]/50"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          className="bg-[#111118] border border-[#1E1E2E] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4A017]/50"
        >
          <option value="all">All Plans</option>
          <option value="premium">Premium</option>
          <option value="free">Free</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[#111118] border border-[#1E1E2E] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4A017]/50"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <button
          onClick={() => fetchUsers({ page: 1 })}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#111118] border border-[#1E1E2E] rounded-lg text-xs text-gray-400 hover:text-white hover:border-[#D4A017]/50 transition-colors"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-4 py-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-[#D4A017]" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-12 text-center">
          <Users size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm mb-1">No users found</p>
          <p className="text-gray-600 text-xs">
            {search || filterRole !== 'all' || filterPlan !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your filters'
              : 'Users will appear here once they register'}
          </p>
        </div>
      ) : (
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden">
          {/* Table scroll container */}
          <div className="overflow-x-auto">
            <div className="min-w-[750px]">
              {/* Header */}
              <div className="grid grid-cols-[1.5fr_120px_80px_100px_80px_100px] gap-3 px-4 py-3 border-b border-[#1E1E2E] text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                <span>User</span>
                <span>Plan</span>
                <span>Role</span>
                <span>Joined</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
              </div>

              {/* Rows */}
              {users.map(user => (
                <UserRow
                  key={user.id || user._id}
                  user={user}
                  onSuspend={handleSuspend}
                  onReactivate={handleReactivate}
                  onRoleChange={handleRoleChange}
                  onDelete={handleDelete}
                  onViewDetail={setViewingUserId}
                />
              ))}
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#1E1E2E]">
              <span className="text-[10px] text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-1.5 text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                  const pageNum = pagination.page <= 3
                    ? i + 1
                    : pagination.page + i - 2;
                  if (pageNum < 1 || pageNum > pagination.totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-7 h-7 text-[10px] font-medium rounded-lg transition-colors ${
                        pageNum === pagination.page
                          ? 'bg-[#D4A017] text-white'
                          : 'text-gray-500 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-1.5 text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* User Detail Drawer */}
      {viewingUserId && (
        <UserDetailDrawer
          userId={viewingUserId}
          onClose={() => setViewingUserId(null)}
        />
      )}

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .user-row {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
            padding: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}