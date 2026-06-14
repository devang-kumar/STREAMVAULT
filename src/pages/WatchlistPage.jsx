import { Link, useNavigate } from 'react-router-dom'
import { BookmarkMinus, ChevronLeft } from 'lucide-react'
import { useWatchlist } from '../hooks/useWatchlist'
import MovieCard from '../components/MovieCard'

export default function WatchlistPage() {
  const { watchlist, loading } = useWatchlist()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-[#0A0A0F]">
        <div className="w-10 h-10 border-2 border-[#D4A017] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-10 bg-[#0A0A0F]">
      {/* Back button — sits at the very top edge above content */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-[72px] left-4 sm:left-6 z-30 flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors group"
      >
        <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-display tracking-wide text-white mb-8">My Watchlist</h1>

        {watchlist.length === 0 ? (
          <div className="text-center py-20 bg-[#12121A] rounded-2xl border border-[#1E1E2E]">
            <div className="w-16 h-16 rounded-full bg-[#1A1A24] flex items-center justify-center mx-auto mb-4">
              <BookmarkMinus size={28} className="text-gray-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Your watchlist is empty</h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto text-sm leading-relaxed">
              Looks like you haven't saved any shows or movies yet. Browse our catalog and click the bookmark icon to add items here.
            </p>
            <Link to="/" className="btn-auth-submit px-6 py-2.5 rounded-lg inline-flex items-center">
              Explore Content
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {watchlist.map((show) => (
              <div key={show._id || show.id} className="relative group/card transition-transform hover:-translate-y-1">
                <MovieCard show={show} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
