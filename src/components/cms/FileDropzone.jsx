import { useCallback, useState, useRef, useEffect } from 'react'
import { Upload, X, File, Loader2, Film, Check, AlertTriangle } from 'lucide-react'

export default function FileDropzone({
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024,
  onUpload,
  onRemove,
  preview = true,
  label = 'Drop file here',
  currentUrl = '',
  showProgress = true,
}) {
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(currentUrl)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  // Sync previewUrl when currentUrl prop changes
  useEffect(() => {
    setPreviewUrl(currentUrl)
  }, [currentUrl])

  const isVideo = (type) => type?.startsWith('video/')
  const isImage = (type) => type?.startsWith('image/')

  const handleFile = useCallback((selectedFile) => {
    setError('')
    setUploadComplete(false)
    if (!selectedFile) return
    if (selectedFile.size > maxSize) {
      const mb = (maxSize / 1024 / 1024).toFixed(0)
      setError(`File too large. Maximum ${mb}MB`)
      return
    }
    setFile(selectedFile)
    if (preview) {
      if (isImage(selectedFile.type)) {
        const url = URL.createObjectURL(selectedFile)
        setPreviewUrl(url)
      } else if (isVideo(selectedFile.type)) {
        const url = URL.createObjectURL(selectedFile)
        setPreviewUrl(url)
      }
    }
  }, [accept, maxSize, preview])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    handleFile(droppedFile)
  }, [handleFile])

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true) }
  const handleDragLeave = () => setDragOver(false)
  const handleClick = () => inputRef.current?.click()

  const handleInputChange = (e) => {
    if (e.target.files[0]) handleFile(e.target.files[0])
  }

  const clearFile = () => {
    setFile(null)
    setPreviewUrl('')
    setError('')
    setProgress(0)
    setUploadComplete(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleRemove = async () => {
    clearFile()
    if (onRemove) onRemove()
  }

  const uploadFile = async () => {
    if (!file) return
    setUploading(true)
    setProgress(0)
    setError('')
    try {
      // Simulate progress while upload is happening
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + Math.random() * 15
        })
      }, 200)

      if (onUpload) await onUpload(file)

      clearInterval(progressInterval)
      setProgress(100)
      setUploadComplete(true)
      setFile(null)
      // Keep previewUrl for the uploaded file
      setTimeout(() => {
        setUploadComplete(false)
      }, 2000)
    } catch (err) {
      setError(err.message || 'Upload failed')
      setProgress(0)
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`
  }

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-all ${
          dragOver
            ? 'border-[#F59E0B] bg-[#F59E0B]/5'
            : previewUrl
              ? 'border-[rgba(255,255,255,0.12)] bg-[#141415]'
              : 'border-[rgba(255,255,255,0.06)] bg-[#141415] hover:border-[rgba(255,255,255,0.12)]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick() }}
        />

        {/* Preview with existing URL */}
        {previewUrl && !file && preview ? (
          <div className="relative w-full">
            {isVideo(currentUrl) || currentUrl?.includes('.mp4') || currentUrl?.includes('video') ? (
              <video
                src={previewUrl}
                controls
                className="mx-auto max-h-[120px] rounded object-contain w-full"
                style={{ pointerEvents: 'auto' }}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <img src={previewUrl} alt="Preview" className="mx-auto max-h-[120px] max-w-full rounded object-contain" />
            )}
            <div className="absolute -right-2 -top-2 flex gap-1">
              {onRemove && (
                <button type="button" onClick={(e) => { e.stopPropagation(); handleRemove() }}
                  className="rounded-full bg-[#0F0F10] p-1 text-red-400 hover:text-red-300 border border-[rgba(255,255,255,0.06)]">
                  <X size={12} />
                </button>
              )}
            </div>
            {/* File name overlay */}
            <div className="mt-1 text-center">
              <span className="text-[10px] text-[#6B7280] truncate block">{currentUrl.split('/').pop()}</span>
            </div>
          </div>
        ) : file && preview ? (
          /* Preview with selected file */
          <div className="relative w-full">
            {isVideo(file.type) ? (
              <video
                src={previewUrl}
                controls
                className="mx-auto max-h-[120px] rounded object-contain w-full"
                style={{ pointerEvents: 'auto' }}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <img src={previewUrl} alt="Preview" className="mx-auto max-h-[120px] max-w-full rounded object-contain" />
            )}
            {!uploading && (
              <button type="button" onClick={(e) => { e.stopPropagation(); clearFile() }}
                className="absolute -right-2 -top-2 rounded-full bg-[#0F0F10] p-1 text-[#9CA3AF] hover:text-white border border-[rgba(255,255,255,0.06)]">
                <X size={12} />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            {uploading ? (
              <Loader2 size={24} className="animate-spin text-[#F59E0B]" />
            ) : isVideo(accept) || accept?.includes('video') ? (
              <>
                <div className="rounded-full bg-[#F59E0B]/10 p-2">
                  <Film size={16} className="text-[#F59E0B]" />
                </div>
                <div>
                  <p className="text-xs text-[#9CA3AF]">{label}</p>
                  <p className="text-[10px] text-[#6B7280] mt-0.5">
                    MP4, MOV, WEBM · Max {(maxSize / 1024 / 1024 / 1024).toFixed(0)}GB
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-full bg-[#F59E0B]/10 p-2">
                  <Upload size={16} className="text-[#F59E0B]" />
                </div>
                <div>
                  <p className="text-xs text-[#9CA3AF]">{label}</p>
                  <p className="text-[10px] text-[#6B7280] mt-0.5">
                    {accept.replace(/,/g, ', ')} · Max {(maxSize / 1024 / 1024).toFixed(0)}MB
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Upload progress bar */}
      {uploading && showProgress && (
        <div className="mt-2 rounded-md bg-[#141415] border border-[rgba(255,255,255,0.06)] p-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-[#9CA3AF] truncate max-w-[70%]">{file?.name}</span>
            <span className="text-[10px] text-[#F59E0B] font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#0F0F10] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#F59E0B] rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload complete indicator */}
      {uploadComplete && (
        <div className="mt-2 flex items-center gap-2 rounded-md bg-[#10B981]/10 border border-[#10B981]/20 px-3 py-2">
          <Check size={12} className="text-[#10B981]" />
          <span className="text-[11px] text-[#10B981]">Upload complete</span>
        </div>
      )}

      {/* File info and upload button */}
      {file && !uploading && !uploadComplete && (
        <div className="mt-2 flex items-center justify-between rounded-md bg-[#141415] px-3 py-2 border border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-2 min-w-0">
            {isVideo(file.type) ? (
              <Film size={14} className="text-[#9CA3AF] flex-shrink-0" />
            ) : (
              <File size={14} className="text-[#9CA3AF] flex-shrink-0" />
            )}
            <span className="truncate text-xs text-[#9CA3AF]">{file.name}</span>
            <span className="text-[10px] text-[#6B7280]">({formatFileSize(file.size)})</span>
          </div>
          <button type="button" onClick={uploadFile}
            className="rounded-md bg-[#F59E0B] px-3 py-1 text-[10px] font-medium text-black hover:bg-[#D97706] transition-colors">
            Upload
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-1 flex items-center gap-1">
          <AlertTriangle size={10} className="text-red-400" />
          <p className="text-[11px] text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}