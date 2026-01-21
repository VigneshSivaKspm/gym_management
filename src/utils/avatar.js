import axios from 'axios'
import { storage } from '../../lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export const uploadAvatar = async (userId, file) => {
  try {
    // Upload to Firebase Storage
    const storageRef = ref(storage, `avatars/${userId}/${file.name}`)
    await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(storageRef)
    
    return { success: true, url: downloadURL }
  } catch (error) {
    console.error('Avatar upload failed:', error)
    throw new Error('Failed to upload avatar')
  }
}
