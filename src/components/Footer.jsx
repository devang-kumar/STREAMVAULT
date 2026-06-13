import { Link, useNavigate } from 'react-router-dom'
import { Instagram, Youtube, Twitter, Smartphone, MonitorPlay } from 'lucide-react'
import { OTT_CATEGORIES } from '../data/categories'

export default function Footer() {
  const navigate = useNavigate()

  return (
    <footer className="mt-16 border-t border-[#1E1E2E] bg-[#09090e] px-4 py-12 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-screen-2xl">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-4 xl:col-span-2">
            <img
              src="/icons/logo.png"
              alt="Black Shortz"
              className="h-10 w-auto object-contain"
            />
            <p className="max-w-md text-sm leading-relaxed text-gray-500">
              StreamVault brings cinematic originals, thrillers, anime-inspired stories, and premium episodic entertainment in one OTT home.
            </p>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2a2a3d] px-4 py-2 text-sm text-gray-200 transition-colors hover:border-[#D4A017]/40 hover:text-white">
                <Smartphone size={15} /> Google Play
              </button>
              <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2a2a3d] px-4 py-2 text-sm text-gray-200 transition-colors hover:border-[#D4A017]/40 hover:text-white">
                <MonitorPlay size={15} /> App Store
              </button>
            </div>

            <div className="flex items-center gap-2">
              {[
                { icon: Instagram, label: 'Instagram' },
                { icon: Youtube, label: 'YouTube' },
                { icon: Twitter, label: 'X' },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  aria-label={label}
                  className="rounded-lg border border-[#242436] p-2.5 text-gray-400 transition-colors hover:border-[#D4A017]/50 hover:text-[#D4A017]"
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Company</h4>
            <div className="space-y-2 text-sm text-gray-500">
              <Link to="/about-us" className="block transition-colors hover:text-gray-300">About Us</Link>
              <Link to="/careers" className="block transition-colors hover:text-gray-300">Careers</Link>
              <Link to="/terms-of-service" className="block transition-colors hover:text-gray-300">Terms of Service</Link>
              <Link to="/privacy-policy" className="block transition-colors hover:text-gray-300">Privacy Policy</Link>
              <Link to="/cookie-policy" className="block transition-colors hover:text-gray-300">Cookie Policy</Link>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Support</h4>
            <div className="space-y-2 text-sm text-gray-500">
              <Link to="/help-center" className="block transition-colors hover:text-gray-300">Help Center</Link>
              <Link to="/contact-us" className="block transition-colors hover:text-gray-300">Contact Us</Link>
              <Link to="/subscription" className="block transition-colors hover:text-gray-300">Subscription Plans</Link>
              <Link to="/profile" className="block transition-colors hover:text-gray-300">Account Settings</Link>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Categories</h4>
            <div className="flex flex-wrap gap-2">
              {OTT_CATEGORIES.slice(0, 10).map((cat) => (
                <button
                  key={cat}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(cat)}`)}
                  className="rounded-full border border-[#2a2a3d] px-2.5 py-1 text-xs text-gray-400 transition-all hover:border-[#D4A017]/60 hover:bg-[#D4A017]/10 hover:text-[#D4A017]"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-[#1E1E2E] pt-6 text-xs text-gray-600 sm:flex-row sm:items-center">
          <p>© 2026 StreamVault. All rights reserved.</p>
          <p>Crafted for cinematic streaming across every screen.</p>
        </div>
      </div>
    </footer>
  )
}
