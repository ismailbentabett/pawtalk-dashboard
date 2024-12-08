'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { storage } from '@/lib/firebase'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { cn } from '@/lib/utils'
import { ImageIcon, Loader2, ArrowUpDown, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ModernImageUploadProps {
  onImagesChange: (urls: string[]) => void
  className?: string
}

export function ModernImageUpload({ onImagesChange, className }: ModernImageUploadProps) {
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadImage = async (file: File): Promise<string> => {
    const timestamp = Date.now()
    const storageRef = ref(storage, `pet-images/${timestamp}_${file.name}`)
    await uploadBytes(storageRef, file)
    return getDownloadURL(storageRef)
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true)
    setError(null)

    try {
      const uploadPromises = acceptedFiles.map(uploadImage)
      const urls = await Promise.all(uploadPromises)
      setImages(prevImages => [...prevImages, ...urls])
      onImagesChange([...images, ...urls])
    } catch (err) {
      setError('Failed to upload images')
    } finally {
      setUploading(false)
    }
  }, [images, onImagesChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    onImagesChange(newImages)
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images]
    const [movedImage] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, movedImage)
    setImages(newImages)
    onImagesChange(newImages)
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary'
        )}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Loader2 className="w-10 h-10 mx-auto text-primary animate-spin" />
        ) : (
          <>
            <ImageIcon className="w-10 h-10 mx-auto text-gray-400 mb-4" />
            <p className="text-sm text-gray-600">
              Drag & drop images here, or click to select files
            </p>
          </>
        )}
      </div>

      {images.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Uploaded Images</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((url, index) => (
              <div key={url} className="relative group">
                <img
                  src={url}
                  alt={`Uploaded ${index + 1}`}
                  className={cn(
                    'w-full aspect-square object-cover rounded-lg',
                    index === 0 && 'ring-2 ring-primary'
                  )}
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => moveImage(index, Math.max(0, index - 1))}
                    disabled={index === 0}
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeImage(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                {index === 0 && (
                  <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                    Main
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

