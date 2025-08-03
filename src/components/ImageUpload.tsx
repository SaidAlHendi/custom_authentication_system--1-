import { useState, useRef } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { toast } from 'sonner'
import { getGermanErrorMessage } from '@/utils/errorHandler'

interface ImageUploadProps {
  objectId: string
  section: 'keys' | 'rooms' | 'meters'
  sectionIndex?: number
  token: string
  isDisabled?: boolean
}

export function ImageUpload({
  objectId,
  section,
  sectionIndex,
  token,
  isDisabled,
}: ImageUploadProps) {
  const generateUploadUrl = useMutation(api.objectImages.generateUploadUrl)
  const addObjectImage = useMutation(api.objectImages.addObjectImage)
  const deleteObjectImage = useMutation(api.objectImages.deleteObjectImage)

  const [isUploading, setIsUploading] = useState(false)
  const [showCameraPermissionDialog, setShowCameraPermissionDialog] =
    useState(false)
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState<
    boolean | null
  >(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get images for this section and index
  const images = useQuery(api.objectImages.getObjectImagesByIndex, {
    token,
    objectId: objectId as Id<'objects'>,
    section,
    sectionIndex,
  })

  // Prüfe Kamera-Berechtigung
  const checkCameraPermission = async (): Promise<boolean> => {
    try {
      // Prüfe ob navigator.mediaDevices verfügbar ist
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log('MediaDevices API nicht verfügbar')
        return false
      }

      // Prüfe aktuelle Berechtigung
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({
          name: 'camera' as PermissionName,
        })

        if (permission.state === 'granted') {
          return true
        } else if (permission.state === 'denied') {
          return false
        }
      }

      // Fallback: Versuche Kamera-Zugriff
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }, // Rückkamera bevorzugen
        })
        // Stream sofort beenden, da wir nur testen
        stream.getTracks().forEach((track) => track.stop())
        return true
      } catch (error) {
        console.log('Kamera-Zugriff verweigert:', error)
        return false
      }
    } catch (error) {
      console.error('Fehler bei Kamera-Berechtigung:', error)
      return false
    }
  }

  // Behandle Foto-Button Klick
  const handlePhotoClick = async () => {
    if (isDisabled) return

    // Zeige Dialog für Berechtigungen
    setShowCameraPermissionDialog(true)
  }

  // Bestätige Kamera-Nutzung
  const handleConfirmCameraUse = async () => {
    setShowCameraPermissionDialog(false)

    const hasPermission = await checkCameraPermission()
    setCameraPermissionGranted(hasPermission)

    if (hasPermission) {
      // Öffne Datei-Dialog mit Kamera-Fokus
      if (fileInputRef.current) {
        fileInputRef.current.click()
      }
    } else {
      toast.error(
        'Kamera-Zugriff nicht möglich. Bitte Berechtigung in den Browser-Einstellungen aktivieren.'
      )
    }
  }

  // Behandle Galerie-Button Klick
  const handleGalleryClick = () => {
    if (isDisabled) return

    // Erstelle temporären Input ohne capture für Galerie
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = 'image/*'
    // Kein capture-Attribut = Galerie wird bevorzugt
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement
      handleImageUpload(target.files)
    }
    input.click()
  }

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || isDisabled) return

    setIsUploading(true)

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} ist kein gültiges Bild`)
          continue
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} ist zu groß (max 5MB)`)
          continue
        }

        // Generate upload URL
        const uploadUrl = await generateUploadUrl({ token })

        // Upload file
        const result = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': file.type },
          body: file,
        })

        if (!result.ok) {
          throw new Error(`Upload failed: ${result.statusText}`)
        }

        const { storageId } = await result.json()

        // Save image reference
        await addObjectImage({
          token,
          objectId: objectId as Id<'objects'>,
          section,
          sectionIndex,
          storageId,
          filename: file.name,
        })
      }

      toast.success('Bilder wurden hochgeladen')
    } catch (error: any) {
      toast.error('Fehler beim Hochladen: ' + error.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    if (confirm('Bild wirklich löschen?')) {
      try {
        await deleteObjectImage({
          token,
          imageId: imageId as Id<'objectImages'>,
        })
        toast.success('Bild wurde gelöscht')
      } catch (error: any) {
        toast.error(getGermanErrorMessage(error))
      }
    }
  }

  const getSectionLabel = () => {
    switch (section) {
      case 'keys':
        return 'Schlüssel'
      case 'rooms':
        return 'Räume'
      case 'meters':
        return 'Zähler'
      default:
        return section
    }
  }

  if (images === undefined) {
    return (
      <div className='mt-4'>
        <div className='animate-pulse'>
          <div className='h-4 bg-gray-200 rounded w-1/4 mb-2'></div>
          <div className='h-32 bg-gray-200 rounded'></div>
        </div>
      </div>
    )
  }

  return (
    <div className='mt-4'>
      <div className='flex justify-between items-center mb-3'>
        <h4 className='font-medium'>Bilder - {getSectionLabel()}</h4>
        {!isDisabled && (
          <div className='flex items-center gap-2'>
            {/* Versteckter Input für Kamera */}
            <input
              ref={fileInputRef}
              type='file'
              multiple
              accept='image/*'
              capture='environment' // Rückkamera bevorzugen
              onChange={(e) => handleImageUpload(e.target.files)}
              className='hidden'
              disabled={isUploading}
            />

            {/* Kamera Button */}
            <button
              onClick={handlePhotoClick}
              disabled={isUploading}
              className={`bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-1 ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Foto machen
            </button>

            {/* Galerie Button */}
            <button
              onClick={handleGalleryClick}
              disabled={isUploading}
              className={`bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center gap-1 ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Galerie
            </button>
          </div>
        )}
      </div>

      {/* Kamera-Berechtigung Dialog */}
      {showCameraPermissionDialog && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg p-6 max-w-sm w-full'>
            <h3 className='text-lg font-semibold mb-4'>Kamera-Zugriff</h3>
            <p className='text-gray-600 mb-6'>
              Diese App möchte auf Ihre Kamera zugreifen, um Fotos zu machen.
              Zusätzlich wird auf Ihre Foto-Galerie zugegriffen.
            </p>
            <div className='flex gap-3'>
              <button
                onClick={() => setShowCameraPermissionDialog(false)}
                className='flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50'
              >
                Abbrechen
              </button>
              <button
                onClick={handleConfirmCameraUse}
                className='flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
              >
                Erlauben
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Berechtigungs-Status Anzeige */}
      {cameraPermissionGranted === false && (
        <div className='mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm'>
          <p className='text-yellow-800'>
            Kamera-Zugriff nicht verfügbar. Sie können weiterhin Bilder aus der
            Galerie auswählen.
          </p>
        </div>
      )}

      {/* Upload Status */}
      {isUploading && (
        <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm'>
          <p className='text-blue-800'> Lade Bilder hoch...</p>
        </div>
      )}

      {/* Bilder Grid */}
      {images && images.length > 0 ? (
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          {images.map((image) => (
            <div key={image._id} className='relative group'>
              <img
                src={image.url || ''}
                alt={image.filename}
                className='w-full h-32 object-cover rounded border'
                onError={(e) => {
                  e.currentTarget.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%236b7280' text-anchor='middle' dy='.3em'%3EBild nicht verfügbar%3C/text%3E%3C/svg%3E"
                }}
              />
              {!isDisabled && (
                <button
                  onClick={() => handleDeleteImage(image._id)}
                  className='absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity'
                >
                  ✕
                </button>
              )}
              <div className='text-xs text-gray-500 mt-1 truncate'>
                {image.filename}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='text-gray-500 text-sm'>Keine Bilder vorhanden</div>
      )}
    </div>
  )
}

// ImageGallery Komponente bleibt unverändert
interface ImageGalleryProps {
  title: string
  images: Array<{
    _id: string
    filename: string
    url: string | null
  }>
}

export function ImageGallery({ title, images }: ImageGalleryProps) {
  if (!images || images.length === 0) {
    return null
  }

  return (
    <div className='mt-4'>
      <h4 className='font-medium mb-3'>{title}</h4>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        {images.map((image) => (
          <div key={image._id} className='relative'>
            <img
              src={image.url || ''}
              alt={image.filename}
              className='w-full h-32 object-cover rounded border'
              onError={(e) => {
                e.currentTarget.src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%236b7280' text-anchor='middle' dy='.3em'%3EBild nicht verfügbar%3C/text%3E%3C/svg%3E"
              }}
            />
            <div className='text-xs text-gray-500 mt-1 truncate'>
              {image.filename}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
