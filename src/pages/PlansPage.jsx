import { useState, useEffect } from 'react'
import {
  Plus, Edit, Trash2, ToggleLeft, ToggleRight,
  CreditCard, Users, BarChart3, Loader2, AlertTriangle,
  X, Check, Star, Smartphone, Monitor, Tv
} from 'lucide-react'
import {
  adminGetAllPlans, adminCreatePlan, adminUpdatePlan,
  adminTogglePlan, adminDeletePlan
} from '../api/client'

// ── Empty form state ──
const emptyPlan = {
  name: '',
  description: '',
  price: '',
  billingCycle: 'monthly',
  features: '',
  maxDevices: 1,
  streamingQuality: 'HD',
  isActive: true,
  isPopular: false,
  badge: '',
  sortOrder: 0,
  trialDays: 0,
  razorpayPlanId: '',
}

const CYCLE_LABELS = { weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' }
const QUALITY_OPTIONS = ['SD', 'HD', 'Full HD', '4K']
const CYCLE_OPTIONS = ['weekly', 'monthly', 'yearly']

export default function PlansPage() {
  const [plans, setPlans] = useState([])
  const [stats, setStats] = useState({ totalPlans: 0, activePlans: 0, totalSubscribers: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editPlan, setEditPlan] = useState(null)
  const [formData, setFormData] = useState(emptyPlan)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 4000)
  }

  const fetchPlans = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await adminGetAllPlans()
      setPlans(res.plans || [])
      setStats(res.stats || { totalPlans: 0, activePlans: 0, totalSubscribers: 0 })
    } catch (err) {
      setError(err.message || 'Failed to load plans')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPlans() }, [])

  // ── Open create modal ──
  const handleCreate = () => {
    setEditPlan(null)
    setFormData(emptyPlan)
    setShowModal(true)
  }

  // ── Open edit modal ──
  const handleEdit = (plan) => {
    setEditPlan(plan)
    setFormData({
      name: plan.name || '',
      description: plan.description || '',
      price: plan.price ?? '',
      billingCycle: plan.billingCycle || 'monthly',
      features: Array.isArray(plan.features) ? plan.features.join(', ') : '',
      maxDevices: plan.maxDevices || 1,
      streamingQuality: plan.streamingQuality || 'HD',
      isActive: plan.isActive !== false,
      isPopular: plan.isPopular === true,
      badge: plan.badge || '',
      sortOrder: plan.sortOrder || 0,
      trialDays: plan.trialDays || 0,
      razorpayPlanId: plan.razorpayPlanId || '',
    })
    setShowModal(true)
  }

  // ── Toggle active status ──
  const handleToggle = async (id) => {
    try {
      await adminTogglePlan(id)
      await fetchPlans()
      showMessage('success', 'Plan status updated')
    } catch (err) {
      showMessage('error', err.message || 'Failed to toggle plan')
    }
  }

  // ── Delete plan ──
  const handleDelete = async (id) => {
    setDeleting(id)
    setConfirmDelete(null)
    try {
      await adminDeletePlan(id)
      showMessage('success', 'Plan deleted successfully')
      await fetchPlans()
    } catch (err) {
      showMessage('error', err.message || 'Failed to delete plan')
    } finally {
      setDeleting(null)
    }
  }

  // ── Save (create or update) ──
  const handleSave = async () => {
    if (!formData.name.trim()) {
      showMessage('error', 'Plan name is required')
      return
    }
    if (!formData.price && formData.price !== 0) {
      showMessage('error', 'Price is required')
      return
    }
    if (Number(formData.price) < 0) {
      showMessage('error', 'Price cannot be negative')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        maxDevices: Number(formData.maxDevices),
        sortOrder: Number(formData.sortOrder),
        trialDays: Number(formData.trialDays),
      }

      if (editPlan) {
        await adminUpdatePlan(editPlan._id, payload)
        showMessage('success', 'Plan updated successfully')
      } else {
        await adminCreatePlan(payload)
        showMessage('success', 'Plan created successfully')
      }
      setShowModal(false)
      setEditPlan(null)
      setFormData(emptyPlan)
      await fetchPlans()
    } catch (err) {
      showMessage('error', err.message || 'Failed to save plan')
    } finally {
      setSaving(false)
    }
  }

  // ── Format price ──
  const formatPrice = (price) => {
    if (price === 0) return 'Free'
    return `₹${Number(price).toLocaleString('en-IN')}`
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-white">Subscription Plans</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 text-sm bg-[#D4A017] hover:bg-[#b8860b] text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
          <Plus size={14} /> Create Plan
        </button>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`mb-4 flex items-center gap-2 text-sm rounded-lg px-4 py-2 ${
          message.type === 'success'
            ? 'bg-green-500/10 border border-green-500/30 text-green-300'
            : 'bg-red-500/10 border border-red-500/30 text-red-300'
        }`}>
          {message.type === 'success' ? <Check size={14} /> : <AlertTriangle size={14} />}
          {message.text}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Plans', value: stats.totalPlans, icon: CreditCard, color: 'text-[#D4A017]' },
          { label: 'Active Plans', value: stats.activePlans, icon: BarChart3, color: 'text-green-400' },
          { label: 'Total Subscribers', value: stats.totalSubscribers, icon: Users, color: 'text-blue-400' },
        ].map(card => (
          <div key={card.label} className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded-lg">
                <card.icon size={18} className={card.color} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{card.label}</p>
                <p className="text-xl font-bold text-white">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-4 py-2">
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      {/* Plans table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-[#D4A017]" />
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-12 text-center">
          <CreditCard size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm mb-1">No plans yet</p>
          <p className="text-gray-600 text-xs mb-4">Create your first subscription plan to get started.</p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 text-sm bg-[#D4A017] hover:bg-[#b8860b] text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            <Plus size={14} /> Create Plan
          </button>
        </div>
      ) : (
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-x-auto">
          {/* Table header */}
          <div className="min-w-[700px]">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto_auto] gap-3 px-4 py-3 border-b border-[#1E1E2E] text-[10px] text-gray-500 font-medium uppercase tracking-wider">
            <span>Plan</span>
            <span>Price</span>
            <span>Billing</span>
            <span>Quality</span>
            <span>Devices</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Rows */}
          {plans.map(plan => (
            <div
              key={plan._id}
              className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto_auto] gap-3 px-4 py-3 border-b border-[#1E1E2E]/50 last:border-0 items-center hover:bg-white/[0.02] transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white">{plan.name}</p>
                  {plan.badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      plan.badge === 'Most Popular' ? 'bg-yellow-500/20 text-yellow-400'
                      : plan.badge === 'Best Value' ? 'bg-[#D4A017]/20 text-[#D4A017]'
                      : 'bg-green-500/20 text-green-400'
                    }`}>
                      {plan.badge}
                    </span>
                  )}
                  {plan.isPopular && (
                    <Star size={10} className="text-yellow-400 fill-yellow-400" />
                  )}
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5 truncate max-w-[200px]">
                  {plan.description || 'No description'}
                </p>
                {plan.trialDays > 0 && (
                  <p className="text-[10px] text-green-400 mt-0.5">{plan.trialDays}-day free trial</p>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{formatPrice(plan.price)}</p>
                {plan.price > 0 && (
                  <p className="text-[10px] text-gray-500">{plan.currency || 'INR'}</p>
                )}
              </div>
              <span className="text-xs text-gray-400 capitalize">{CYCLE_LABELS[plan.billingCycle] || plan.billingCycle}</span>
              <span className="text-xs text-gray-400">{plan.streamingQuality}</span>
              <div className="flex items-center gap-1">
                {plan.maxDevices === 1 ? (
                  <Smartphone size={12} className="text-gray-500" />
                ) : plan.maxDevices <= 2 ? (
                  <Monitor size={12} className="text-gray-500" />
                ) : (
                  <Tv size={12} className="text-gray-500" />
                )}
                <span className="text-xs text-gray-400">{plan.maxDevices}</span>
              </div>
              <button
                onClick={() => handleToggle(plan._id)}
                className="flex items-center gap-1.5"
                title={plan.isActive ? 'Click to deactivate' : 'Click to activate'}
              >
                {plan.isActive ? (
                  <ToggleRight size={20} className="text-green-400" />
                ) : (
                  <ToggleLeft size={20} className="text-gray-600" />
                )}
                <span className={`text-[10px] font-medium ${plan.isActive ? 'text-green-400' : 'text-gray-500'}`}>
                  {plan.isActive ? 'Active' : 'Disabled'}
                </span>
              </button>
              <div className="flex items-center gap-1 justify-end">
                <span className="text-[10px] text-gray-500 mr-1">
                  {plan.subscriberCount || 0} sub{(plan.subscriberCount || 0) !== 1 ? 's' : ''}
                </span>
                {confirmDelete === plan._id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(plan._id)}
                      disabled={deleting === plan._id}
                      className="px-2 py-1 text-[10px] bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                    >
                      {deleting === plan._id ? <Loader2 size={10} className="animate-spin" /> : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="px-2 py-1 text-[10px] bg-gray-500/20 text-gray-400 rounded hover:bg-gray-500/30 transition-colors"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(plan)}
                      className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(plan._id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {/* ── Create/Edit Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div
            className="relative w-full max-w-lg bg-[#0D0D14] border border-[#1E1E2E] rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
            style={{ animation: 'fadeUp 0.25s ease forwards' }}
          >
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 z-10 text-gray-500 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg"
            >
              <X size={16} />
            </button>

            {/* Modal header */}
            <div className="px-6 pt-6 pb-4 border-b border-[#1E1E2E]">
              <p className="text-[10px] text-[#D4A017] font-semibold tracking-widest uppercase mb-1">
                {editPlan ? 'Edit Plan' : 'New Plan'}
              </p>
              <h2 className="font-display text-2xl text-white tracking-wide">
                {editPlan ? `Edit ${editPlan.name}` : 'Create Subscription Plan'}
              </h2>
            </div>

            {/* Form */}
            <div className="px-6 py-5 space-y-4">
              {/* Plan Name */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Plan Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#111118] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4A017]/50 transition-colors"
                  placeholder="e.g. Premium Monthly"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full bg-[#111118] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4A017]/50 transition-colors resize-none"
                  placeholder="Brief description of this plan"
                />
              </div>

              {/* Price + Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-[#111118] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4A017]/50 transition-colors"
                    placeholder="0 for free"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Billing Cycle *</label>
                  <select
                    value={formData.billingCycle}
                    onChange={e => setFormData({ ...formData, billingCycle: e.target.value })}
                    className="w-full bg-[#111118] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4A017]/50 transition-colors"
                  >
                    {CYCLE_OPTIONS.map(c => (
                      <option key={c} value={c}>{CYCLE_LABELS[c]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Features (comma-separated)</label>
                <textarea
                  value={formData.features}
                  onChange={e => setFormData({ ...formData, features: e.target.value })}
                  rows={3}
                  className="w-full bg-[#111118] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4A017]/50 transition-colors resize-none"
                  placeholder="e.g. HD streaming, 2 screens, No ads"
                />
              </div>

              {/* Max Devices + Quality */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Max Devices</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.maxDevices}
                    onChange={e => setFormData({ ...formData, maxDevices: e.target.value })}
                    className="w-full bg-[#111118] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4A017]/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Streaming Quality</label>
                  <select
                    value={formData.streamingQuality}
                    onChange={e => setFormData({ ...formData, streamingQuality: e.target.value })}
                    className="w-full bg-[#111118] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4A017]/50 transition-colors"
                  >
                    {QUALITY_OPTIONS.map(q => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Badge + Trial Days */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Badge Text</label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={e => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full bg-[#111118] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4A017]/50 transition-colors"
                    placeholder="e.g. Most Popular"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Free Trial (days)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.trialDays}
                    onChange={e => setFormData({ ...formData, trialDays: e.target.value })}
                    className="w-full bg-[#111118] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4A017]/50 transition-colors"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Sort Order + Razorpay ID */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Sort Order</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sortOrder}
                    onChange={e => setFormData({ ...formData, sortOrder: e.target.value })}
                    className="w-full bg-[#111118] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4A017]/50 transition-colors"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Razorpay Plan ID</label>
                  <input
                    type="text"
                    value={formData.razorpayPlanId}
                    onChange={e => setFormData({ ...formData, razorpayPlanId: e.target.value })}
                    className="w-full bg-[#111118] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4A017]/50 transition-colors"
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-[#1E1E2E] bg-[#111118] text-[#D4A017] focus:ring-[#D4A017]/50"
                  />
                  <span className="text-sm text-gray-300">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPopular}
                    onChange={e => setFormData({ ...formData, isPopular: e.target.checked })}
                    className="w-4 h-4 rounded border-[#1E1E2E] bg-[#111118] text-[#D4A017] focus:ring-[#D4A017]/50"
                  />
                  <span className="text-sm text-gray-300">Popular</span>
                </label>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-[#1E1E2E] flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-[#D4A017] hover:bg-[#b8860b] text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editPlan ? 'Save Changes' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal animation keyframe */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}