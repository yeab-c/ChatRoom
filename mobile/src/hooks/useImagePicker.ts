import { useState } from 'react';
import { Alert } from 'react-native';
import imageUploadService from '../services/upload/imageUpload';
import type { ImageUploadOptions, UploadProgress } from '../services/upload/imageUpload';

export const useImagePicker = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  
   // Pick and upload image
   
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

      if (url) {
        console.log('Image uploaded successfully:', url);
      }

      return url;
    } catch (error: any) {
      console.error('Image upload failed:', error);
      
      const errorMessage = error.response?.data?.message || 'Failed to upload image. Please try again.';
      Alert.alert('Upload Failed', errorMessage);
      
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  
   // Show image picker options modal
   
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

  
   // Upload profile picture
   
  const uploadProfilePicture = async (useCamera: boolean = false): Promise<string | null> => {
    return pickAndUpload(useCamera, {
      type: 'profile',
      maxWidth: 500,
      maxHeight: 500,
      quality: 0.8,
    });
  };

  
   // Upload message image
   
  const uploadMessageImage = async (useCamera: boolean = false): Promise<string | null> => {
    return pickAndUpload(useCamera, {
      type: 'message',
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.7,
    });
  };

  
   // Upload group avatar
   
  const uploadGroupAvatar = async (useCamera: boolean = false): Promise<string | null> => {
    return pickAndUpload(useCamera, {
      type: 'group',
      maxWidth: 500,
      maxHeight: 500,
      quality: 0.8,
    });
  };

  return {
    // Generic
    pickAndUpload,
    showImagePickerOptions,

    // Specific types
    uploadProfilePicture,
    uploadMessageImage,
    uploadGroupAvatar,

    // State
    isUploading,
    uploadProgress,
  };
};












