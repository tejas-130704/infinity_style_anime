'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Check, FileText, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { formatCurrency } from '@/lib/pricing-utils';
import { useRouter } from 'next/navigation';

/** Single SKU: 18 × 24 in standard poster (price in paisa). */
const POSTER_STANDARD = {
  value: '18x24',
  label: '18 × 24 inches',
  subtitle: 'Standard size',
  price: 99900,
} as const;

export function PersonalizedPosterUpload() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload JPG, PNG, or PDF files only');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Create preview for images only
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null); // PDF preview not supported
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const calculatePrice = () => POSTER_STANDARD.price;

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('sizeOption', POSTER_STANDARD.value);
      formData.append('materialType', 'Standard');

      const response = await fetch('/api/upload/personalized-poster', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadSuccess(true);
      
      // Redirect to profile or cart after 2 seconds
      setTimeout(() => {
        router.push('/profile?tab=custom');
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Failed to upload. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
      <h2 className="font-cinzel text-3xl font-bold text-white mb-2">
        Create Personalized Poster
      </h2>
      <p className="text-white/60 text-sm mb-6">
        Upload your image and we'll create a high-quality poster for you
      </p>

      {/* Disclaimer */}
      <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
        <p className="text-sm text-yellow-200">
          <strong>Quality Notice:</strong> For best results, please upload high-resolution images (minimum 300 DPI recommended). 
          Low-quality images may result in pixelated prints and suboptimal results.
        </p>
      </div>

      <div className="space-y-6">
        {/* File Upload Area */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Upload Your Image
          </label>
          
          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative cursor-pointer rounded-lg border-2 border-dashed border-white/30 bg-white/5 p-12 text-center transition-all hover:border-mugen-gold hover:bg-white/10"
            >
              <Upload className="mx-auto h-12 w-12 text-white/40 mb-4" />
              <p className="text-white font-medium mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-white/60">
                JPG, PNG, or PDF (max 10MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="rounded-lg border border-white/20 bg-white/5 p-4">
              <div className="flex items-start gap-4">
                {/* Preview */}
                <div className="flex-shrink-0">
                  {previewUrl ? (
                    <div className="relative h-32 w-32 rounded-lg overflow-hidden border-2 border-mugen-gold">
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-32 w-32 rounded-lg border-2 border-mugen-gold bg-white/10 flex items-center justify-center">
                      <FileText className="h-12 w-12 text-white/60" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate mb-1">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-white/60 mb-2">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    onClick={handleRemoveFile}
                    className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300"
                  >
                    <X className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Poster size (fixed) */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Poster size
          </label>
          <div className="rounded-lg border-2 border-mugen-gold/50 bg-mugen-gold/10 px-4 py-3 text-white">
            <div className="font-semibold">{POSTER_STANDARD.label}</div>
            <div className="text-sm text-white/70 mt-0.5">{POSTER_STANDARD.subtitle}</div>
            <div className="text-sm text-mugen-gold mt-2">{formatCurrency(POSTER_STANDARD.price)}</div>
          </div>
        </div>

        {/* Price Preview */}
        <div className="rounded-lg border border-mugen-gold/30 bg-mugen-gold/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold">Total Price:</span>
            <span className="text-2xl font-bold text-mugen-gold">
              {formatCurrency(calculatePrice())}
            </span>
          </div>
          <p className="text-xs text-white/60 mt-1">
            GST included • Delivery ₹89 additional
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Success Message */}
        {uploadSuccess && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
            <div className="flex items-center gap-2 text-green-400">
              <Check className="h-5 w-5" />
              <span className="font-semibold">Upload successful!</span>
            </div>
            <p className="text-sm text-green-300 mt-1">
              Redirecting to your profile...
            </p>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading || uploadSuccess}
          className="w-full rounded-lg bg-mugen-crimson px-6 py-4 font-bold text-white shadow-lg transition-all hover:bg-mugen-crimson/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : uploadSuccess ? (
            <>
              <Check className="h-5 w-5" />
              <span>Uploaded!</span>
            </>
          ) : (
            <>
              <ImageIcon className="h-5 w-5" />
              <span>Create Poster</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
