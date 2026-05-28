import { useState, useEffect } from 'react'
import { Trash2, Shield, User, Loader2, AlertTriangle, Check } from 'lucide-react'
import { adminGetUsers, adminDeleteUser } from '../../api/client'

const PLAN_COLORS = {
  Free: 'bg-gray-400/10 text-gray-400',
  Basic: 'bg-blue-400/10 text-blue-400',
  Standard: 'bg-green-400/10 text-green-400',
  Premium: 'bg-[#F5C518]/10 text-[#F5C518]',
  free: 'bg-gray-400/10 text-gray-400',
  basic: 'bg-blue-400/10 text-blue-400',
  standard: 'bg-green-400/10 text-green-400',
  premium: 'bg-[#F5C518]/10 text-[#F5C518]',
}

export default function SectionUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await adminGetUsers()
      setUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      setUsers([])
      showMessage('error', err.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 4000)
  }

  const filtered = users.filter(
    (u) => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()),
  )

  const handleDelete = async (id) => {
    setDeleting(id)
    setConfirmDelete(null)
    try {
      await adminDeleteUser(id)
      showMessage('success', 'User deleted successfully')
      fetchUsers()
    } catch (err) {
      showMessage('error', err.message || 'Failed to delete user')
    } finally {
      setDeleting(null)
    }
  }

  const planCounts = {}
  users.forEach((u) => {
    const plan = u.plan || 'Free'
    planCounts[plan] = (planCounts[plan] || 0) + 1
  })
  const planKeys = ['Free', 'Basic', 'Standard', 'Premium']

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-2xl text-white">Users</h2>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-dark w-full text-xs sm:w-48"
          placeholder="Search users..."
        />
      </div>

      {message.text && (
        <div
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${
            message.type === 'success'
              ? 'border border-green-500/30 bg-green-500/10 text-green-300'
              : 'border border-red-500/30 bg-red-500/10 text-red-300'
          }`}
        >
          {message.type === 'success' ? <Check size={14} /> : <AlertTriangle size={14} />}
          {message.text}
        </div>
      )}

      {users.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {planKeys.map((plan) => (
            <div key={plan} className="glass rounded-xl p-4 text-center">
              <p className="font-display text-2xl text-white">{planCounts[plan] || 0}</p>
              <p className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${PLAN_COLORS[plan] || PLAN_COLORS.Free}`}>
                {plan}
              </p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-gray-500" />
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-xl">
          <div className="overflow-x-auto">
            <div className="grid min-w-[980px] grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-4 border-b border-[#1E1E2E] px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
              <span>User</span>
              <span>Email</span>
              <span>Plan</span>
              <span>Role</span>
              <span>Since</span>
              <span>Actions</span>
            </div>

            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">{search ? 'No users match your search.' : 'No users found.'}</div>
            ) : (
              filtered.map((user) => (
                <div
                  key={user.id}
                  className="grid min-w-[980px] grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] items-center gap-4 border-b border-[#1E1E2E]/50 px-4 py-3 transition-colors last:border-0 hover:bg-white/3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-7 w-7 flex-shrink-0 rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                    <span className="truncate text-sm font-medium text-white">{user.name}</span>
                  </div>

                  <span className="truncate text-xs text-gray-400">{user.email}</span>
                  <span className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-medium ${PLAN_COLORS[user.plan] || PLAN_COLORS.Free}`}>
                    {user.plan || 'Free'}
                  </span>

                  <div className="flex items-center gap-1">
                    {user.role === 'admin' ? <Shield size={12} className="text-[#D4A017]" /> : <User size={12} className="text-gray-500" />}
                    <span className="text-xs capitalize text-gray-400">{user.role}</span>
                  </div>

                  <span className="text-xs text-gray-500">{user.since || '-'}</span>

                  {confirmDelete === user.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={deleting === user.id}
                        className="rounded bg-red-500/20 p-1 text-[10px] text-red-400 hover:bg-red-500/30"
                      >
                        {deleting === user.id ? <Loader2 size={12} className="animate-spin" /> : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="rounded bg-gray-500/20 p-1 text-[10px] text-gray-400 hover:bg-gray-500/30"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(user.id)}
                      className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-400/10 hover:text-red-400"
                      title="Delete user"
                      disabled={user.role === 'admin'}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
