import { useState, useEffect } from 'react'
import { Check, Star, Zap, Gift, Loader2, AlertTriangle } from 'lucide-react'
import CheckoutModal from '../components/CheckoutModal'
import { getPlans } from '../api/client'

// ── Transform DB plan into display-friendly format ──
function formatPlan(plan) {
  const hasTrial = plan.trialDays > 0
  return {
    ...plan,
    priceLabel: plan.price === 0 ? '₹0' : `₹${plan.price.toLocaleString('en-IN')}`,
    subLabel: plan.price === 0 ? 'Forever free' : `per ${plan.billingCycle === 'weekly' ? 'week' : plan.billingCycle === 'yearly' ? 'year' : 'month'}`,
    trialNote: hasTrial ? `${plan.trialDays} days free, then ₹${plan.price.toLocaleString('en-IN')}/${plan.billingCycle === 'weekly' ? 'week' : plan.billingCycle === 'yearly' ? 'year' : 'month'}` : null,
    savings: plan.billingCycle === 'yearly' && plan.price > 0 ? `Save vs monthly` : null,
    cta: plan.price === 0 ? 'Continue Free' : hasTrial ? 'Start Free Trial' : 'Subscribe Now',
    lockedFeatures: plan.price === 0 ? ['Full episodes', 'HD / 4K streaming', 'Downloads'] : [],
  }
}

// ── Subscription Page ──
export default function SubscriptionPage() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [showCheckout, setShowCheckout] = useState(false)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true)
        const res = await getPlans()
        const dbPlans = res.data || []
        const formatted = dbPlans.map(formatPlan)
        setPlans(formatted)
        if (formatted.length > 0) {
          const popular = formatted.find(p => p.isPopular)
          setSelected(popular?._id || formatted[0]?._id)
        }
      } catch (err) {
        setError('Failed to load plans. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    fetchPlans()
  }, [])

  const selectedPlan = plans.find(p => p._id === selected)

  const handleSubscribeClick = () => {
    setShowCheckout(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] pt-24 pb-16 px-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#D4A017]" />
          <p className="text-gray-400 text-sm">Loading plans...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pt-24 pb-16 px-6 relative">
      {/* Background glow */}
      <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-[#D4A017]/10 blur-[80px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-[#D4A017] text-sm font-semibold tracking-widest uppercase mb-2">Choose Your Plan</p>
          <h1 className="font-display text-5xl md:text-6xl text-white tracking-wide mb-4">
            Unlock Everything
          </h1>
          <p className="text-gray-400 max-w-md mx-auto text-sm">
            Stream thousands of hours of premium content. {plans.some(p => p.trialDays > 0) && 'Free trial on paid plans.'}
          </p>
          <div className="inline-flex items-center gap-2 mt-4 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium px-4 py-2 rounded-full">
            <Gift size={12} />
            No credit card required to start
          </div>
        </div>

        {/* Error notice */}
        {error && (
          <div className="mb-6 mx-auto max-w-md flex items-center gap-2 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-2">
            <AlertTriangle size={12} />
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && plans.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">No plans available yet. Check back soon!</p>
          </div>
        )}

        {/* Pricing cards */}
        {plans.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map(plan => {
              const isSelected = selected === plan._id
              return (
                <div
                  key={plan._id}
                  onClick={() => setSelected(plan._id)}
                  className={`relative p-6 rounded-2xl border cursor-pointer transition-all duration-300 ${
                    isSelected
                      ? 'border-[#D4A017] bg-[#D4A017]/5 scale-[1.03]'
                      : 'border-[#1E1E2E] bg-[#111118] hover:border-[#333] hover:scale-[1.01]'
                  }`}
                >
                  {plan.badge && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 whitespace-nowrap px-3 py-1 rounded-full text-[10px] font-bold ${
                      plan.badge === 'Most Popular'
                        ? 'badge-premium'
                        : plan.badge === 'Best Value'
                        ? 'bg-[#D4A017] text-white'
                        : 'bg-green-500 text-white'
                    }`}>
                      {plan.badge === 'Most Popular' && <Star size={9} className="fill-black" />}
                      {plan.badge}
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      {plan.badge === 'Best Value' && <Zap size={14} className="text-[#F5C518]" />}
                      <h3 className="font-bold text-white text-lg">{plan.name}</h3>
                    </div>
                    <div className="flex items-end gap-1">
                      <span className="font-display text-4xl text-white leading-none">
                        {plan.priceLabel}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{plan.subLabel}</p>
                    {plan.savings && (
                      <p className="text-xs text-green-400 mt-1">{plan.savings}</p>
                    )}
                  </div>

                  <div className="h-px bg-[#1E1E2E] mb-4" />

                  <ul className="space-y-2 mb-4">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                        <Check size={13} className="text-[#D4A017] flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                    {(plan.lockedFeatures || []).map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-600 line-through">
                        <Check size={13} className="text-gray-700 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelected(plan._id)
                      setShowCheckout(true)
                    }}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all mt-2 ${
                      isSelected
                        ? 'bg-[#D4A017] hover:bg-[#b8860b] text-white'
                        : 'bg-white/5 hover:bg-white/10 text-white'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Trial note */}
        {selectedPlan?.trialNote && (
          <p className="text-center text-xs text-gray-500 mt-5">
            {selectedPlan.trialNote}
          </p>
        )}

        {/* Main CTA */}
        {plans.length > 0 && (
          <div className="text-center mt-8">
            <button
              onClick={handleSubscribeClick}
              className="btn-shine bg-[#D4A017] hover:bg-[#b8860b] text-white font-bold px-12 py-4 rounded-xl text-lg transition-all hover:scale-105"
            >
              {selectedPlan?.price === 0 ? 'Continue with Free' : 'Start Free Trial'}
            </button>
            <p className="text-xs text-gray-600 mt-3">
              No contracts. Cancel anytime.{' '}
              {selectedPlan?.price !== 0 && selectedPlan?.trialDays > 0 && `${selectedPlan.trialDays}-day free trial included.`}
            </p>
          </div>
        )}

        {/* FAQ */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-[#1E1E2E] pt-10">
          {[
            { q: 'Can I cancel anytime?', a: 'Yes. Cancel from your profile page with no fees or penalties.' },
            { q: 'How does the free trial work?', a: 'Free days on any paid plan. Billed only after the trial ends.' },
            { q: 'Can I switch plans later?', a: 'Absolutely. Upgrade or downgrade your plan anytime from settings.' },
          ].map(item => (
            <div key={item.q}>
              <p className="text-sm font-semibold text-white mb-1">{item.q}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Checkout modal */}
      {showCheckout && selectedPlan && (
        <CheckoutModal
          plan={selectedPlan}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  )
}