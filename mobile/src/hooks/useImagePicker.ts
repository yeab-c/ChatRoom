import { useState } from 'react';
import { Alert } from 'react-native';
import imageUploadService, { ImageUploadOptions, UploadProgress } from '../services/upload/imageUpload';

export const useImagePicker = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  const pickAndUpload = async (
    useCamera: boolean = false,
    options: ImageUploadOptions = {}
  ): Promise<string | null> => {
    try {
      setIsUploading(true);
      setUploadProgress(null);

      const url = await imageUploadService.pickAndUploadImage(
        useCamera,
        options,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      return url;
    } catch (error) {
      console.error('Image upload failed:', error);
      Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const showImagePickerOptions = (
    onImageSelected: (url: string) => void,
    options: ImageUploadOptions = {}
  ) => {
    Alert.alert(
      'Select Image',
      'Choose image source',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const url = await pickAndUpload(true, options);
            if (url) onImageSelected(url);
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            const url = await pickAndUpload(false, options);
            if (url) onImageSelected(url);
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  return {
    pickAndUpload,
    showImagePickerOptions,
    isUploading,
    uploadProgress,
  };
};