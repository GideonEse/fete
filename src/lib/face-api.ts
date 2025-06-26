import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights';

let loadingPromise: Promise<void> | null = null;

export const loadModels = async () => {
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
    } catch (error) {
      console.error('Failed to load face-api models:', error);
      loadingPromise = null; // Reset on failure to allow retry
      throw error;
    }
  })();
  
  return loadingPromise;
};

export const getFaceDescriptor = async (
  image: string
): Promise<Float32Array | undefined> => {
  await loadModels(); // Ensure models are loaded before inference.

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
