import { useCallback, useState, useRef } from 'react'
import { Upload, X, File, Loader2 } from 'lucide-react'

export default function FileDropzone({
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024,
  onUpload,
  preview = true,
  label = 'Drop file here',
  currentUrl = '',
}) {
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(currentUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  const handleFile = useCallback((selectedFile) => {
    setError('')
    if (!selectedFile) return
    if (selectedFile.size > maxSize) {
      const mb = (maxSize / 1024 / 1024).toFixed(0)
      setError(`File too large. Maximum ${mb}MB`)
      return
    }
    setFile(selectedFile)
    if (preview && selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile)
      setPreviewUrl(url)
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
    setFile(null); setPreviewUrl(''); setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const uploadFile = async () => {
    if (!file) return
    setUploading(true)
    try {
      if (onUpload) await onUpload(file)
      clearFile()
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
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
        {previewUrl && preview ? (
          <div className="relative w-full">
            <img src={previewUrl} alt="Preview" className="mx-auto max-h-[120px] rounded object-contain" />
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
      {file && !uploading && (
        <div className="mt-2 flex items-center justify-between rounded-md bg-[#141415] px-3 py-2 border border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-2 min-w-0">
            <File size={14} className="text-[#9CA3AF] flex-shrink-0" />
            <span className="truncate text-xs text-[#9CA3AF]">{file.name}</span>
            <span className="text-[10px] text-[#6B7280]">({(file.size / 1024 / 1024).toFixed(1)}MB)</span>
          </div>
          <button type="button" onClick={uploadFile}
            className="rounded-md bg-[#F59E0B] px-3 py-1 text-[10px] font-medium text-black hover:bg-[#D97706] transition-colors">
            Upload
          </button>
        </div>
      )}
      {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}
    </div>
  )
}