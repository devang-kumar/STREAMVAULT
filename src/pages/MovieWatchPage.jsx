import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { getMovie } from '../api/client'

export default function MovieWatchPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const [movie, setMovie] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setIsLoading(true)
        setError('')
        const data = await getMovie(id)
        if (mounted) setMovie(data)
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to load movie')
      } finally {
        if (mounted) setIsLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [id])

  if (isLoading) return <div className="min-h-screen bg-black" />

  if (!movie || error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-gray-400">
        {error || 'Movie not found.'}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#050508]">
      <div className="z-20 flex items-center gap-4 bg-gradient-to-b from-black/90 to-transparent px-5 py-3">
        <button onClick={() => navigate(`/movies/${id}`)} className="flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white">
          <ChevronLeft size={18} /> <span className="hidden sm:inline">Back</span>
        </button>
        <p className="truncate text-sm font-semibold text-white">{movie.title}</p>
      </div>
      <div className="flex flex-1 items-center justify-center bg-black">
        <video
          ref={videoRef}
          src={movie.videoUrl}
          controls
          autoPlay
          playsInline
          className="h-full max-h-[calc(100vh-52px)] w-full object-contain"
        />
      </div>
    </div>
  )
}
