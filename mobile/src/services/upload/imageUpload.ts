import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import apiClient from '../api/client';

export interface ImageUploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  type?: 'profile' | 'message' | 'group';
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

class ImageUploadService {
  /**
   * Pick image from camera or gallery
   */
  async pickImage(useCamera: boolean = false): Promise<string | null> {
    try {
      // Request permissions
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          alert('Camera permission is required!');
          return null;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Gallery permission is required!');
          return null;
        }
      }

      // Pick image
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            allowsMultipleSelection: false,
            quality: 0.8,
          });

      if (result.canceled) {
        return null;
      }

      return result.assets[0].uri;
    } catch (error) {
      console.error('Error picking image:', error);
      throw error;
    }
  }

  /**
   * Compress and resize image
   */
  async compressImage(
    uri: string,
    options: ImageUploadOptions = {}
  ): Promise<string> {
    try {
      const {
        maxWidth = 1024,
        maxHeight = 1024,
        quality = 0.7,
      } = options;

      const manipulatedImage = await manipulateAsync(
        uri,
        [{ resize: { width: maxWidth, height: maxHeight } }],
        {
          compress: quality,
          format: SaveFormat.JPEG,
        }
      );

      return manipulatedImage.uri;
    } catch (error) {
      console.error('Error compressing image:', error);
      throw error;
    }
  }

  /**
   * Upload image via backend API
   * Uses your backend endpoints: /api/upload/profile, /api/upload/message, /api/upload/group
   */
  async uploadImage(
    uri: string,
    options: ImageUploadOptions = {},
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      const { type = 'message' } = options;

      // Compress image first
      const compressedUri = await this.compressImage(uri, options);

      // Create form data
      const formData = new FormData();
      
      // Get file info
      const fileExtension = compressedUri.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}.${fileExtension}`;

      // Append image file
      formData.append('image', {
        uri: compressedUri,
        type: `image/${fileExtension}`,
        name: fileName,
      } as any);

      // Determine endpoint based on type
      let endpoint = '/upload/message';
      if (type === 'profile') endpoint = '/upload/profile';
      else if (type === 'group') endpoint = '/upload/group';

      // Upload via your backend (which uses Cloudinary)
      const response = await apiClient.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress: UploadProgress = {
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
            };
            onProgress?.(progress);
          }
        },
      });

      // Backend returns: { success: true, data: { url, publicId } }
      const imageUrl = response.data.data.url;
      console.log('Image uploaded successfully:', imageUrl);
      
      return imageUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Complete flow: Pick -> Compress -> Upload
   */
  async pickAndUploadImage(
    useCamera: boolean = false,
    options: ImageUploadOptions = {},
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string | null> {
    try {
      // Pick image
      const uri = await this.pickImage(useCamera);
      if (!uri) return null;

      // Upload image via backend
      const imageUrl = await this.uploadImage(uri, options, onProgress);
      return imageUrl;
    } catch (error) {
      console.error('Error in pickAndUploadImage:', error);
      throw error;
    }
  }

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(
    useCamera: boolean = false,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string | null> {
    return this.pickAndUploadImage(
      useCamera,
      {
        type: 'profile',
        maxWidth: 500,
        maxHeight: 500,
        quality: 0.8,
      },
      onProgress
    );
  }

  /**
   * Upload message image
   */
  async uploadMessageImage(
    useCamera: boolean = false,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string | null> {
    return this.pickAndUploadImage(
      useCamera,
      {
        type: 'message',
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.7,
      },
      onProgress
    );
  }

  /**
   * Upload group avatar
   */
  async uploadGroupAvatar(
    useCamera: boolean = false,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string | null> {
    return this.pickAndUploadImage(
      useCamera,
      {
        type: 'group',
        maxWidth: 500,
        maxHeight: 500,
        quality: 0.8,
      },
      onProgress
    );
  }
}

export default new ImageUploadService();