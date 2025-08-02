import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface ImageUploadProps {
  objectId: string;
  section: "keys" | "rooms" | "meters";
  token: string;
  isDisabled?: boolean;
}

export function ImageUpload({ objectId, section, token, isDisabled }: ImageUploadProps) {
  const generateUploadUrl = useMutation(api.objectImages.generateUploadUrl);
  const addObjectImage = useMutation(api.objectImages.addObjectImage);
  const deleteObjectImage = useMutation(api.objectImages.deleteObjectImage);
  
  const [isUploading, setIsUploading] = useState(false);

  // Get images for this section
  const images = useQuery(api.objectImages.getObjectImages, {
    token,
    objectId: objectId as Id<"objects">,
    section,
  });

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || isDisabled) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} ist kein gültiges Bild`);
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} ist zu groß (max 5MB)`);
          continue;
        }

        // Generate upload URL
        const uploadUrl = await generateUploadUrl({ token });
        
        // Upload file
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!result.ok) {
          throw new Error(`Upload failed: ${result.statusText}`);
        }

        const { storageId } = await result.json();

        // Save image reference
        await addObjectImage({
          token,
          objectId: objectId as Id<"objects">,
          section,
          storageId,
          filename: file.name,
        });
      }
      
      toast.success("Bilder wurden hochgeladen");
    } catch (error: any) {
      toast.error("Fehler beim Hochladen: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (confirm("Bild wirklich löschen?")) {
      try {
        await deleteObjectImage({ 
          token,
          imageId: imageId as Id<"objectImages"> 
        });
        toast.success("Bild wurde gelöscht");
      } catch (error: any) {
        toast.error("Fehler beim Löschen: " + error.message);
      }
    }
  };

  const getSectionLabel = () => {
    switch (section) {
      case "keys": return "Schlüssel";
      case "rooms": return "Räume";
      case "meters": return "Zähler";
      default: return section;
    }
  };

  if (images === undefined) {
    return (
      <div className="mt-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-medium">Bilder - {getSectionLabel()}</h4>
        {!isDisabled && (
          <div className="flex items-center gap-2">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleImageUpload(e.target.files)}
              className="hidden"
              id={`upload-${section}-${objectId}`}
              disabled={isUploading}
            />
            <label
              htmlFor={`upload-${section}-${objectId}`}
              className={`cursor-pointer bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors ${
                isUploading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isUploading ? "Lade hoch..." : "Bilder hinzufügen"}
            </label>
          </div>
        )}
      </div>

      {images && images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((image) => (
            <div key={image._id} className="relative group">
              <img
                src={image.url || ""}
                alt={image.filename}
                className="w-full h-32 object-cover rounded border"
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%236b7280' text-anchor='middle' dy='.3em'%3EBild nicht verfügbar%3C/text%3E%3C/svg%3E";
                }}
              />
              {!isDisabled && (
                <button
                  onClick={() => handleDeleteImage(image._id)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              )}
              <div className="text-xs text-gray-500 mt-1 truncate">
                {image.filename}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 text-sm">Keine Bilder vorhanden</div>
      )}
    </div>
  );
}

interface ImageGalleryProps {
  title: string;
  images: Array<{
    _id: string;
    filename: string;
    url: string | null;
  }>;
}

export function ImageGallery({ title, images }: ImageGalleryProps) {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h4 className="font-medium mb-3">{title}</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((image) => (
          <div key={image._id} className="relative">
            <img
              src={image.url || ""}
              alt={image.filename}
              className="w-full h-32 object-cover rounded border"
              onError={(e) => {
                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%236b7280' text-anchor='middle' dy='.3em'%3EBild nicht verfügbar%3C/text%3E%3C/svg%3E";
              }}
            />
            <div className="text-xs text-gray-500 mt-1 truncate">
              {image.filename}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 