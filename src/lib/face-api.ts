import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://unpkg.com/face-api.js@0.22.2/weights';

let loadingPromise: Promise<void> | null = null;

const loadAllModels = async () => {
  try {
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
  } catch (error) {
    console.error('Failed to load face-api models:', error);
    // Reset promise on failure to allow retry on next call
    loadingPromise = null;
    // Rethrow to propagate the error to the caller
    throw error;
  }
};

export const loadModels = (): Promise<void> => {
  if (!loadingPromise) {
    loadingPromise = loadAllModels();
  }
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
