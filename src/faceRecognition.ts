import * as faceapi from 'face-api.js';

let modelsLoaded = false;

// Load semua model face-api.js
export async function loadModels(): Promise<void> {
  if (modelsLoaded) return;
  
  try {
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    
    modelsLoaded = true;
    console.log('✅ Face recognition models loaded successfully');
  } catch (error) {
    console.error('❌ Error loading face recognition models:', error);
    throw new Error('Gagal memuat model face recognition. Pastikan koneksi internet stabil.');
  }
}

// Deteksi wajah dari video element
export async function detectFace(videoElement: HTMLVideoElement): Promise<faceapi.FaceDetection | null> {
  if (!modelsLoaded) {
    await loadModels();
  }
  
  const detection = await faceapi.detectSingleFace(
    videoElement,
    new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
  );
  
  return detection || null;
}

// Dapatkan face descriptor dari video
export async function getFaceDescriptor(videoElement: HTMLVideoElement): Promise<number[] | null> {
  if (!modelsLoaded) {
    await loadModels();
  }
  
  const detection = await faceapi
    .detectSingleFace(
      videoElement,
      new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
    )
    .withFaceLandmarks()
    .withFaceDescriptor();
  
  if (!detection) {
    return null;
  }
  
  return Array.from(detection.descriptor);
}

// Bandingkan dua face descriptors
export function compareFaceDescriptors(descriptor1: number[], descriptor2: number[]): number {
  const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
  return distance;
}

// Kenali wajah dari video berdasarkan daftar pegawai
export async function recognizeFace(
  videoElement: HTMLVideoElement,
  pegawaiList: Array<{ id: string; nama: string; faceDescriptor?: number[] }>
): Promise<{ pegawaiId: string; nama: string; distance: number } | null> {
  if (!modelsLoaded) {
    await loadModels();
  }
  
  const detection = await faceapi
    .detectSingleFace(
      videoElement,
      new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
    )
    .withFaceLandmarks()
    .withFaceDescriptor();
  
  if (!detection) {
    return null;
  }
  
  const descriptor = Array.from(detection.descriptor);
  
  // Filter pegawai yang memiliki face descriptor
  const pegawaiWithFaces = pegawaiList.filter(p => p.faceDescriptor && p.faceDescriptor.length > 0);
  
  if (pegawaiWithFaces.length === 0) {
    return null;
  }
  
  // Cari pegawai dengan distance terkecil
  let bestMatch: { pegawaiId: string; nama: string; distance: number } | null = null;
  let minDistance = Infinity;
  
  for (const pegawai of pegawaiWithFaces) {
    const distance = faceapi.euclideanDistance(descriptor, pegawai.faceDescriptor!);
    
    if (distance < minDistance) {
      minDistance = distance;
      bestMatch = {
        pegawaiId: pegawai.id,
        nama: pegawai.nama,
        distance: distance,
      };
    }
  }
  
  // Threshold untuk match (semakin kecil semakin strict)
  // 0.6 adalah threshold yang reasonable untuk face recognition
  const MATCH_THRESHOLD = 0.6;
  
  if (bestMatch && bestMatch.distance < MATCH_THRESHOLD) {
    return bestMatch;
  }
  
  return null;
}

// Check apakah models sudah loaded
export function isModelsLoaded(): boolean {
  return modelsLoaded;
}
