import { useState } from 'react'
import { Check, Star, Zap, Gift } from 'lucide-react'
import CheckoutModal from '../components/CheckoutModal'

// ── Plans data — Indian pricing, data-driven ──
const PLANS = [
  {
    id: 'free',
    name: 'Free',
    icon: null,
    price: { weekly: 0, monthly: 0, yearly: 0 },
    priceLabel: { weekly: '₹0', monthly: '₹0', yearly: '₹0' },
    subLabel: { weekly: 'Forever free', monthly: 'Forever free', yearly: 'Forever free' },
    features: [
      'Trailer access only',
      'Limited browsing',
      'No downloads',
      'Ads supported',
    ],
    lockedFeatures: [
      'Full episodes',
      'HD / 4K streaming',
      'Downloads',
    ],
    highlight: false,
    badge: null,
    cta: 'Continue Free',
  },
  {
    id: 'weekly',
    name: 'Weekly',
    icon: null,
    price: { weekly: 99, monthly: 99, yearly: 99 },
    priceLabel: { weekly: '₹99', monthly: '₹99', yearly: '₹99' },
    subLabel: { weekly: 'per week', monthly: 'per week', yearly: 'per week' },
    features: [
      '7-day free trial',
      'Full HD streaming',
      '1 screen at a time',
      'Full episode library',
      'Mobile access',
    ],
    lockedFeatures: [],
    highlight: false,
    badge: 'Try Free',
    cta: 'Start Free Trial',
    trialNote: '7 days free, then ₹99/week',
  },
  {
    id: 'monthly',
    name: 'Monthly',
    icon: null,
    price: { weekly: 199, monthly: 199, yearly: 199 },
    priceLabel: { weekly: '₹199', monthly: '₹199', yearly: '₹199' },
    subLabel: { weekly: 'per month', monthly: 'per month', yearly: 'per month' },
    features: [
      '7-day free trial',
      'Full HD + 4K',
      '2 screens simultaneously',
      'Full episode library',
      'Downloads (5/month)',
      'No ads',
    ],
    lockedFeatures: [],
    highlight: true,
    badge: 'Most Popular',
    cta: 'Start Free Trial',
    trialNote: '7 days free, then ₹199/month',
  },
  {
    id: 'yearly',
    name: 'Yearly',
    icon: Zap,
    price: { weekly: 1999, monthly: 1999, yearly: 1999 },
    priceLabel: { weekly: '₹1,999', monthly: '₹1,999', yearly: '₹1,999' },
    subLabel: { weekly: 'per year', monthly: 'per year', yearly: 'per year' },
    savings: '₹389 saved vs monthly',
    features: [
      '7-day free trial',
      '4K + HDR streaming',
      '4 screens simultaneously',
      'Full episode library',
      'Unlimited downloads',
      'No ads',
      'Early access to new shows',
      'Priority support',
    ],
    lockedFeatures: [],
    highlight: false,
    badge: 'Best Value',
    cta: 'Start Free Trial',
    trialNote: '7 days free, then ₹1,999/year',
  },
]

// ── Subscription Page — layout unchanged, checkout modal added ──
export default function SubscriptionPage() {
  const [selected, setSelected] = useState('monthly')
  // Controls visibility of the checkout modal
  const [showCheckout, setShowCheckout] = useState(false)

  const selectedPlan = PLANS.find(p => p.id === selected)

  // Open checkout modal — called by the main CTA button
  const handleSubscribeClick = () => {
    setShowCheckout(true)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pt-24 pb-16 px-6 relative">
      {/* Background glow — unchanged */}
      <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-[#D4A017]/10 blur-[80px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        {/* Header — unchanged */}
        <div className="text-center mb-12">
          <p className="text-[#D4A017] text-sm font-semibold tracking-widest uppercase mb-2">Choose Your Plan</p>
          <h1 className="font-display text-5xl md:text-6xl text-white tracking-wide mb-4">
            Unlock Everything
          </h1>
          <p className="text-gray-400 max-w-md mx-auto text-sm">
            Stream thousands of hours of premium content. 7-day free trial on all paid plans.
          </p>
          <div className="inline-flex items-center gap-2 mt-4 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium px-4 py-2 rounded-full">
            <Gift size={12} />
            7 days free — no credit card required to start
          </div>
        </div>

        {/* Pricing cards — unchanged */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map(plan => {
            const Icon = plan.icon
            const isSelected = selected === plan.id
            return (
              <div
                key={plan.id}
                onClick={() => setSelected(plan.id)}
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
                    {Icon && <Icon size={14} className="text-[#F5C518]" />}
                    <h3 className="font-bold text-white text-lg">{plan.name}</h3>
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="font-display text-4xl text-white leading-none">
                      {plan.priceLabel.monthly}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{plan.subLabel.monthly}</p>
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
                  {plan.lockedFeatures.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600 line-through">
                      <Check size={13} className="text-gray-700 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Card CTA — selects the plan and opens checkout directly */}
                <button
                  onClick={(e) => {
                    e.stopPropagation() // prevent double-fire from card click
                    setSelected(plan.id)
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

        {/* Trial note */}
        {selectedPlan?.trialNote && (
          <p className="text-center text-xs text-gray-500 mt-5">
            {selectedPlan.trialNote}
          </p>
        )}

        {/* Main CTA — unchanged position, now opens modal */}
        <div className="text-center mt-8">
          <button
            onClick={handleSubscribeClick}
            className="btn-shine bg-[#D4A017] hover:bg-[#b8860b] text-white font-bold px-12 py-4 rounded-xl text-lg transition-all hover:scale-105"
          >
            {selected === 'free' ? 'Continue with Free' : 'Start Free Trial'}
          </button>
          <p className="text-xs text-gray-600 mt-3">
            No contracts. Cancel anytime.{' '}
            {selected !== 'free' && '7-day free trial included.'}
          </p>
        </div>

        {/* FAQ — unchanged */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-[#1E1E2E] pt-10">
          {[
            { q: 'Can I cancel anytime?', a: 'Yes. Cancel from your profile page with no fees or penalties.' },
            { q: 'How does the free trial work?', a: '7 days completely free on any paid plan. Billed only after the trial ends.' },
            { q: 'Can I switch plans later?', a: 'Absolutely. Upgrade or downgrade your plan anytime from settings.' },
          ].map(item => (
            <div key={item.q}>
              <p className="text-sm font-semibold text-white mb-1">{item.q}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Checkout modal — mounts only when showCheckout is true ── */}
      {showCheckout && selectedPlan && (
        <CheckoutModal
          plan={selectedPlan}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  )
}
