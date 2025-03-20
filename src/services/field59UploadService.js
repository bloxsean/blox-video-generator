import axios from 'axios';

/**
 * Upload a video to Field59 using its URL
 * @param {string} videoUrl - URL of the video to upload
 * @param {string} title - Optional title for the video
 * @param {string} username - Field59 username
 * @param {string} password - Field59 password
 * @returns {Promise<string>} - Promise resolving to the video key
 */
export const uploadVideoToField59 = async (videoUrl, title = '', username, password) => {
    console.log('Uploading video to Field59:', videoUrl);
    console.log('Username:', username);
    console.log('Password:', password);
//   try {
//     const response = await axios.post('/api/field59/upload', {
//       url: videoUrl,
//       title,
//       username,
//       password
//     });
    
//     // Parse the XML response
//     const parser = new DOMParser();
//     const xmlDoc = parser.parseFromString(response.data, 'text/xml');
//     const key = xmlDoc.querySelector('key')?.textContent;
    
//     if (!key) {
//       throw new Error('Failed to get video key from response');
//     }
    
//     return key;
//   } catch (error) {
//     console.error('Error uploading to Field59:', error);
//     throw error;
//   }
}; 