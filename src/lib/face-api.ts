import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights';

let modelsLoaded = false;

export const loadModels = async () => {
  if (modelsLoaded) {
    return;
  }
  try {
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
  } catch (error) {
    console.error('Failed to load face-api models:', error);
    // You might want to throw the error or handle it in a way that the UI can be notified
  }
};

export const getFaceDescriptor = async (
  image: string
): Promise<Float32Array | undefined> => {
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
