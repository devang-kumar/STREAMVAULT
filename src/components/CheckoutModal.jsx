import { useEffect, useRef, useState } from 'react'
import { X, Shield, Lock, CheckCircle, AlertCircle, ChevronRight, Loader } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { createPaymentOrder, verifyPayment, updatePlan } from '../api/client'

const loadScript = (src) => {
  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

// ─────────────────────────────────────────────
// CheckoutModal
// Props:
//   plan     — the selected PLANS object
//   onClose  — called when modal is dismissed
// ─────────────────────────────────────────────
export default function CheckoutModal({ plan, onClose }) {
  const { user, refreshUser } = useAuth()
  // Payment step: 'summary' | 'processing' | 'success' | 'failure'
  const [step, setStep] = useState('summary')
  const [error, setError] = useState('')
  const overlayRef = useRef(null)

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // ── Derived plan values ────────────────────
  const planId = plan._id || plan.id || plan.slug || 'free'
  const isFree = plan.price === 0 || planId === 'free'
  const amount = isFree ? 0 : plan.price
  const hasTrial = plan.trialDays > 0 || !!plan.trialNote

  // GST breakdown (18%)
  const gstRate = 0.18
  const baseAmount = isFree ? 0 : Math.round(amount / (1 + gstRate))
  const gstAmount  = isFree ? 0 : amount - baseAmount

  // Billing period label
  const billingPeriodMap = { free: 'Free forever', weekly: 'week', monthly: 'month', yearly: 'year' }
  const billingPeriod = billingPeriodMap[plan.billingCycle] || billingPeriodMap[planId] || 'month'

  // ── Payment handler ────────────────────────
  const handleProceedToPayment = async () => {
    if (isFree) {
      setStep('processing')
      try {
        await updatePlan('Basic')
        if (refreshUser) await refreshUser()
        setStep('success')
      } catch (err) {
        setStep('failure')
        setError(err.message || 'Failed to activate free plan.')
      }
      return
    }

    setStep('processing')
    setError('')

    try {
      // Load Razorpay script
      const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js')
      if (!res) {
        throw new Error('Razorpay SDK failed to load. Are you online?')
      }

      // ── STEP 1: Create order on your backend ──────────────────────────
      const { orderId, currency, amount: orderAmount, key } = await createPaymentOrder(planId, amount * 100)
      
      // ── STEP 2: Open Razorpay checkout ───────────────────────────────
      const rzp = new window.Razorpay({
        key,
        amount: orderAmount,
        currency,
        name: 'StreamVault',
        description: `${plan.name} Plan — ${billingPeriod}`,
        order_id: orderId,
        theme: { color: '#D4A017' },
        prefill: { name: user?.name, email: user?.email },
        handler: async (response) => {
          try {
            // ── STEP 3: Verify payment signature on backend ─────────────
            const verifyRes = await verifyPayment({
              ...response,
              planId: planId,
              amount: amount * 100
            })
            
            if (verifyRes.success) {
              if (refreshUser) await refreshUser()
              setStep('success')
            } else {
              setStep('failure')
              setError('Payment verification failed.')
            }
          } catch (err) {
            setStep('failure')
            setError(err.message || 'Payment verification failed.')
          }
        },
        modal: { 
          ondismiss: () => {
            setStep('summary')
            setError('Payment cancelled')
          } 
        },
      })
      
      rzp.on('payment.failed', function (response){
        setStep('failure')
        setError(response.error.description || 'Payment failed.')
      })

      rzp.open()

    } catch (err) {
      setStep('failure')
      setError(err.message || 'Payment failed. Please try again.')
    }
  }

  // ── Reset back to summary ─────────────────
  const handleRetry = () => {
    setStep('summary')
    setError('')
  }

  return (
    // Backdrop overlay
    <div
      ref={overlayRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
    >
      {/* Modal panel */}
      <div
        className="relative w-full max-w-md bg-[#0D0D14] border border-[#1E1E2E] rounded-2xl overflow-hidden shadow-2xl"
        style={{ animation: 'fadeUp 0.25s ease forwards' }}
      >
        {/* ── Close button — always visible ── */}
        {step !== 'processing' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-gray-500 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg"
          >
            <X size={16} />
          </button>
        )}

        {/* ══════════════════════════════════ */}
        {/* STEP: SUMMARY                      */}
        {/* ══════════════════════════════════ */}
        {step === 'summary' && (
          <div>
            {/* Modal header */}
            <div className="px-6 pt-6 pb-4 border-b border-[#1E1E2E]">
              <p className="text-[10px] text-[#D4A017] font-semibold tracking-widest uppercase mb-1">Checkout</p>
              <h2 className="font-display text-2xl text-white tracking-wide">Order Summary</h2>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Selected plan card */}
              <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Selected Plan</p>
                    <p className="text-lg font-bold text-white mt-0.5">{plan.name}</p>
                  </div>
                  {/* Badge */}
                  {plan.badge && (
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      plan.badge === 'Most Popular' ? 'badge-premium'
                      : plan.badge === 'Best Value'  ? 'bg-[#D4A017] text-white'
                      : 'bg-green-500 text-white'
                    }`}>
                      {plan.badge}
                    </span>
                  )}
                </div>

                {/* Features summary — top 3 */}
                <ul className="space-y-1.5">
                  {plan.features.slice(0, 3).map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                      <div className="w-1 h-1 rounded-full bg-[#D4A017] flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                  {plan.features.length > 3 && (
                    <li className="text-xs text-gray-600">+{plan.features.length - 3} more benefits</li>
                  )}
                </ul>
              </div>

              {/* Billing cycle + amount breakdown */}
              <div className="space-y-2.5">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Billing Details</p>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Billing Cycle</span>
                  <span className="text-white capitalize font-medium">{billingPeriod}</span>
                </div>

                {!isFree && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Base Amount</span>
                      <span className="text-white">₹{baseAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">GST (18%)</span>
                      <span className="text-white">₹{gstAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                )}

                {/* Divider */}
                <div className="h-px bg-[#1E1E2E]" />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Total Due {hasTrial ? 'after trial' : 'today'}</span>
                  <span className="font-display text-2xl text-white">
                    {isFree ? 'Free' : `₹${amount.toLocaleString('en-IN')}`}
                  </span>
                </div>

                {/* Trial note */}
                {hasTrial && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
                    <CheckCircle size={13} className="text-green-400 flex-shrink-0" />
                    <p className="text-xs text-green-400">{plan.trialNote}</p>
                  </div>
                )}
              </div>

              {/* CTA button */}
              <button
                onClick={handleProceedToPayment}
                className="btn-shine w-full bg-[#D4A017] hover:bg-[#b8860b] active:scale-[0.98] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
              >
                {isFree ? 'Activate Free Plan' : 'Proceed to Payment'}
                <ChevronRight size={16} />
              </button>

              {/* Security note */}
              <div className="flex items-center justify-center gap-4 pt-1">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                  <Lock size={10} />
                  Secured by Razorpay
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                  <Shield size={10} />
                  256-bit SSL encrypted
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════ */}
        {/* STEP: PROCESSING                   */}
        {/* ══════════════════════════════════ */}
        {step === 'processing' && (
          <div className="px-6 py-16 flex flex-col items-center justify-center text-center">
            {/* Spinning loader */}
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full border-2 border-[#1E1E2E]" />
              <div
                className="absolute inset-0 w-16 h-16 rounded-full border-2 border-transparent border-t-[#D4A017]"
                style={{ animation: 'spin 0.8s linear infinite' }}
              />
            </div>
            <p className="text-white font-semibold text-lg mb-1">Processing Payment</p>
            <p className="text-gray-500 text-sm">Please wait, do not close this window…</p>
          </div>
        )}

        {/* ══════════════════════════════════ */}
        {/* STEP: SUCCESS                      */}
        {/* ══════════════════════════════════ */}
        {step === 'success' && (
          <div className="px-6 py-12 flex flex-col items-center text-center">
            {/* Success icon with glow */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl" />
              <div className="relative w-16 h-16 bg-green-500/15 border border-green-500/30 rounded-full flex items-center justify-center">
                <CheckCircle size={32} className="text-green-400" />
              </div>
            </div>

            <h2 className="font-display text-3xl text-white tracking-wide mb-2">
              {isFree ? 'Plan Activated!' : 'Payment Successful!'}
            </h2>
            <p className="text-gray-400 text-sm mb-1">
              You're now on the <span className="text-white font-semibold">{plan.name}</span> plan.
            </p>
            {hasTrial && (
              <p className="text-green-400 text-xs mb-6">{plan.trialNote}</p>
            )}
            {!hasTrial && !isFree && (
              <p className="text-gray-500 text-xs mb-6">
                ₹{amount.toLocaleString('en-IN')} charged. A receipt has been sent to your email.
              </p>
            )}

            {/* ── TODO: Razorpay — on success, navigate to home or profile ── */}
            {/* navigate('/profile') or navigate('/') after updating user context */}
            <button
              onClick={onClose}
              className="btn-shine bg-[#D4A017] hover:bg-[#b8860b] text-white font-bold px-8 py-3 rounded-xl transition-all hover:scale-105"
            >
              Start Watching
            </button>
          </div>
        )}

        {/* ══════════════════════════════════ */}
        {/* STEP: FAILURE                      */}
        {/* ══════════════════════════════════ */}
        {step === 'failure' && (
          <div className="px-6 py-12 flex flex-col items-center text-center">
            {/* Failure icon */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl" />
              <div className="relative w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center">
                <AlertCircle size={32} className="text-red-400" />
              </div>
            </div>

            <h2 className="font-display text-3xl text-white tracking-wide mb-2">Payment Failed</h2>
            <p className="text-gray-400 text-sm mb-1">
              {error || 'Something went wrong. Please try again.'}
            </p>
            <p className="text-gray-600 text-xs mb-8">Your card has not been charged.</p>

            <div className="flex items-center gap-3 w-full">
              <button
                onClick={handleRetry}
                className="btn-shine flex-1 bg-[#D4A017] hover:bg-[#b8860b] text-white font-bold py-3 rounded-xl transition-all"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 glass hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-all text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inline keyframe for spin — Tailwind's animate-spin is fine too */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
