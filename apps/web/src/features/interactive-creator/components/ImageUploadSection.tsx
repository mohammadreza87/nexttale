import { useRef } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';

interface ImageUploadSectionProps {
  imagePreview: string | null;
  disabled?: boolean;
  onImageUpload: (file: File) => void;
  onRemoveImage: () => void;
  onError: (message: string) => void;
}

export function ImageUploadSection({
  imagePreview,
  disabled,
  onImageUpload,
  onRemoveImage,
  onError,
}: ImageUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      onError('Image must be smaller than 5MB');
      return;
    }

    onImageUpload(file);
  };

  const handleRemove = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onRemoveImage();
  };

  return (
    <div className="rounded-2xl bg-gray-800/50 p-4">
      <label className="mb-3 block text-sm font-semibold text-gray-300">
        Reference Image (Optional)
      </label>
      <p className="mb-3 text-xs text-gray-500">
        Upload an image to inspire the AI - it can recreate games, analyze charts, or use
        any visual as reference
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {imagePreview ? (
        <div className="relative">
          <img
            src={imagePreview}
            alt="Upload preview"
            className="h-48 w-full rounded-xl bg-gray-900 object-contain"
          />
          <button
            onClick={handleRemove}
            disabled={disabled}
            className="absolute right-2 top-2 rounded-lg bg-red-500/80 p-2 text-white transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-700 bg-gray-800 py-8 text-gray-400 transition-colors hover:border-purple-500 hover:text-purple-400 disabled:opacity-50"
        >
          <ImagePlus className="h-6 w-6" />
          <span>Click to upload an image</span>
        </button>
      )}
    </div>
  );
}
