'use client'

import { useState, useRef } from 'react'
import { Loader2, Upload, X, FileImage } from 'lucide-react'

interface StudentFormProps {
  onVerified: () => void
  onFailed: (error: string) => void
}

export function StudentForm({ onVerified, onFailed }: StudentFormProps) {
  const [enrollmentNumber, setEnrollmentNumber] = useState('')
  const [collegeName, setCollegeName] = useState('')
  const [collegeCity, setCollegeCity] = useState('')
  const [idImage, setIdImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    if (!enrollmentNumber.trim()) errors.enrollmentNumber = 'Enrollment number is required'
    if (!collegeName.trim()) errors.collegeName = 'College name is required'
    if (!collegeCity.trim()) errors.collegeCity = 'College city is required'
    if (!idImage) errors.idImage = 'Please upload your college ID'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((f) => ({ ...f, idImage: 'File must be under 5MB' }))
      return
    }
    setIdImage(file)
    setFieldErrors((f) => ({ ...f, idImage: '' }))
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  const clearImage = () => {
    setIdImage(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('enrollmentNumber', enrollmentNumber.trim())
      formData.append('collegeName', collegeName.trim())
      formData.append('collegeCity', collegeCity.trim())
      formData.append('idImage', idImage!)

      const res = await fetch('/api/student/verify', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (data.verified) {
        onVerified()
      } else {
        onFailed(data.error || 'Verification failed. Upload a valid student ID.')
      }
    } catch {
      onFailed('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (field: string) =>
    `w-full rounded-lg border px-4 py-2.5 text-white placeholder:text-white/40 bg-mugen-black/50 focus:outline-none transition-colors ${
      fieldErrors[field]
        ? 'border-red-500/60 focus:border-red-400'
        : 'border-white/20 focus:border-violet-500'
    }`

  return (
    <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-4" noValidate>
      <div className="h-px bg-white/10 mb-5" />

      {/* Row 1 */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-white/70 uppercase tracking-wide">
            Enrollment Number *
          </label>
          <input
            type="text"
            id="student-enrollment"
            value={enrollmentNumber}
            onChange={(e) => setEnrollmentNumber(e.target.value)}
            className={inputClass('enrollmentNumber')}
            placeholder="e.g. 2021CS1234"
            disabled={loading}
          />
          {fieldErrors.enrollmentNumber && (
            <p className="text-xs text-red-400 mt-1">{fieldErrors.enrollmentNumber}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-white/70 uppercase tracking-wide">
            College Name *
          </label>
          <input
            type="text"
            id="student-college-name"
            value={collegeName}
            onChange={(e) => setCollegeName(e.target.value)}
            className={inputClass('collegeName')}
            placeholder="e.g. IIT Delhi"
            disabled={loading}
          />
          {fieldErrors.collegeName && (
            <p className="text-xs text-red-400 mt-1">{fieldErrors.collegeName}</p>
          )}
        </div>
      </div>

      {/* Row 2 */}
      <div>
        <label className="mb-1 block text-xs font-semibold text-white/70 uppercase tracking-wide">
          College City *
        </label>
        <input
          type="text"
          id="student-college-city"
          value={collegeCity}
          onChange={(e) => setCollegeCity(e.target.value)}
          className={inputClass('collegeCity')}
          placeholder="e.g. New Delhi"
          disabled={loading}
        />
        {fieldErrors.collegeCity && (
          <p className="text-xs text-red-400 mt-1">{fieldErrors.collegeCity}</p>
        )}
      </div>

      {/* ID Upload */}
      <div>
        <label className="mb-1 block text-xs font-semibold text-white/70 uppercase tracking-wide">
          Upload College ID *
        </label>

        {preview ? (
          <div className="relative rounded-lg overflow-hidden border border-violet-500/40 bg-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="College ID preview"
              className="w-full max-h-40 object-contain"
            />
            <button
              type="button"
              onClick={clearImage}
              disabled={loading}
              className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-red-600/80 transition-colors"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="px-3 py-1.5 bg-black/40 text-xs text-white/60 flex items-center gap-1.5">
              <FileImage className="h-3 w-3" />
              {idImage?.name}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className={`w-full rounded-lg border-2 border-dashed px-4 py-8 flex flex-col items-center justify-center gap-2 transition-colors hover:border-violet-500/60 hover:bg-violet-500/5 ${
              fieldErrors.idImage
                ? 'border-red-500/50'
                : 'border-white/20'
            }`}
          >
            <Upload className="h-8 w-8 text-white/30" />
            <span className="text-sm text-white/50">Click to upload college ID</span>
            <span className="text-xs text-white/30">JPG, PNG, WEBP — max 5MB</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          onChange={handleFileChange}
          className="hidden"
          id="student-id-upload"
        />
        {fieldErrors.idImage && (
          <p className="text-xs text-red-400 mt-1">{fieldErrors.idImage}</p>
        )}
      </div>

      {/* Submit */}
      <div className="space-y-3">
        <button
          type="submit"
          disabled={loading}
          id="verify-student-btn"
          className="w-full rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed px-6 py-3 font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 shadow shadow-violet-900/20"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verifying your ID…</span>
            </>
          ) : (
            <span>✦ Verify Student</span>
          )}
        </button>


      </div>

      {loading && (
        <p className="text-center text-xs text-white/40 animate-pulse">
          This may take 10–20 seconds…
        </p>
      )}
    </form>
  )
}
