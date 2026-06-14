import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Star, X, Zap, CheckCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

/**
 * PremiumGateModal
 *
 * Props:
 *   type    — 'series' | 'season' | 'episode'
 *   title   — name of the locked content (optional, shown in the modal)
 *   onClose — called when the user dismisses
 */
export default function PremiumGateModal({ type = 'episode', title = '', onClose }) {
  const navigate   = useNavigate()
  const { user }   = useAuth()
  const overlayRef = useRef(null)

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Centralized close handler that redirects to home
  const handleClose = () => {
    onClose()
    navigate('/')
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleClose])

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === overlayRef.current) handleClose()
  }

  const handleUpgrade = () => {
    onClose()
    if (!user) {
      navigate('/login?mode=signin')
    } else {
      navigate('/profile', { state: { openSubscription: true } })
    }
  }

  const headlines = {
    series:  { tag: 'Premium Series', heading: 'Unlock the Full Series', sub: 'This series is exclusively available to premium subscribers.' },
    season:  { tag: 'Premium Season',  heading: 'Unlock This Season',     sub: 'This season requires an active premium subscription.' },
    episode: { tag: 'Premium Episode', heading: 'Unlock This Episode',    sub: 'Upgrade your plan to watch this episode and thousands more.' },
  }

  const { tag, heading, sub } = headlines[type] || headlines.episode

  const perks = [
    'Unlimited HD & 4K streaming',
    'All premium series & episodes',
    'No ads, ever',
    'Download for offline viewing',
  ]

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ background: 'rgba(5,5,10,0.88)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="relative w-full max-w-sm bg-[#0D0D14] border border-[#1E1E2E] rounded-2xl overflow-hidden shadow-2xl"
        style={{ animation: 'premiumFadeUp 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
      >
        {/* Gold top bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#D4A017,#F5C518,#D4A017)' }} />

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors z-10"
        >
          <X size={15} />
        </button>

        {/* Content */}
        <div className="px-7 pt-7 pb-6 text-center">
          {/* Icon */}
          <div className="relative mx-auto mb-5 w-fit">
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-50"
              style={{ background: 'radial-gradient(circle,#F5C518 0%,transparent 70%)' }}
            />
            <div className="relative w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                 style={{ background: 'linear-gradient(135deg,rgba(212,160,23,0.25),rgba(245,197,24,0.1))', border: '1.5px solid rgba(212,160,23,0.4)' }}>
              <Lock size={26} className="text-[#F5C518]" />
            </div>
          </div>

          {/* Tag */}
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3"
                style={{ background: 'rgba(212,160,23,0.12)', color: '#F5C518', border: '1px solid rgba(212,160,23,0.25)' }}>
            <Star size={9} className="fill-[#F5C518]" />
            {tag}
          </span>

          <h2 className="font-display text-2xl text-white tracking-wide mb-2">{heading}</h2>

          {title && (
            <p className="text-xs text-[#D4A017] font-medium mb-2 truncate">"{title}"</p>
          )}

          <p className="text-sm text-gray-400 mb-5 leading-relaxed">{sub}</p>

          {/* Perks */}
          <ul className="space-y-2 mb-6 text-left">
            {perks.map(p => (
              <li key={p} className="flex items-center gap-2.5 text-xs text-gray-300">
                <CheckCircle size={13} className="text-[#D4A017] flex-shrink-0" />
                {p}
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <button
            onClick={handleUpgrade}
            className="w-full py-3 rounded-xl font-bold text-sm text-black transition-all hover:scale-[1.02] active:scale-[0.98] mb-2.5"
            style={{ background: 'linear-gradient(135deg,#D4A017,#F5C518)', boxShadow: '0 4px 24px rgba(212,160,23,0.35)' }}
          >
            <Zap size={14} className="inline mr-1.5 mb-0.5" />
            {user ? 'Upgrade to Premium' : 'Sign In to Unlock'}
          </button>

          <button
            onClick={handleClose}
            className="w-full py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Back to Home
          </button>
        </div>

        <style>{`
          @keyframes premiumFadeUp {
            from { opacity: 0; transform: scale(0.92) translateY(16px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
      </div>
    </div>
  )
}
