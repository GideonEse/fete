import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

// Let components manage loading state. face-api.js handles not re-loading models.
export const loadModels = async () => {
  try {
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
  } catch (error) {
    console.error('Error loading face-api models:', error);
    // Rethrow to allow components to handle the UI state
    throw new Error('Failed to load face recognition models.');
  }
};

export const getFaceDescriptor = async (
  image: string
): Promise<Float32Array | undefined> => {
  // It is the responsibility of the calling component to ensure models are loaded first.
  try {
    const img = await faceapi.fetchImage(image);
    const detection = await faceapi
      .detectSingleFace(img, new faceapi.SsdMobilenetv1Options())
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    return detection?.descriptor;
  } catch (error) {
    console.error('Error getting face descriptor:', error);
    return undefined;
  }
};
