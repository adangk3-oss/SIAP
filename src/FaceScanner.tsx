import React, { useRef, useEffect, useState } from 'react';
import { Pegawai } from './types';
import { loadModels, getFaceDescriptor, recognizeFace } from './faceRecognition';

interface FaceScannerProps {
  mode: 'enroll' | 'recognize';
  pegawai?: Pegawai;
  pegawaiList?: Pegawai[];
  onEnrollComplete?: (descriptor: number[]) => void;
  onRecognizeComplete?: (pegawaiId: string, nama: string) => void;
  onError?: (error: string) => void;
}

export function FaceScanner({ mode, pegawai, pegawaiList, onEnrollComplete, onRecognizeComplete, onError }: FaceScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [status, setStatus] = useState<string>('Memuat model...');
  const [faceDetected, setFaceDetected] = useState(false);
  const [enrollCount, setEnrollCount] = useState(0);
  const [enrollDescriptors, setEnrollDescriptors] = useState<number[][]>([]);

  // Load models dan start camera
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        setStatus('Memuat model face recognition...');
        await loadModels();
        
        if (!mounted) return;
        
        setStatus('Mengakses kamera...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: 640, 
            height: 480,
            facingMode: 'user'
          }
        });
        
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsStreaming(true);
          setStatus(mode === 'enroll' ? 'Posisikan wajah di tengah frame' : 'Mengenali wajah...');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing face scanner:', error);
        setStatus('Error: ' + (error instanceof Error ? error.message : 'Gagal mengakses kamera'));
        setIsLoading(false);
        if (onError) {
          onError(error instanceof Error ? error.message : 'Gagal mengakses kamera');
        }
      }
    };

    init();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recognitionIntervalRef.current) {
        clearInterval(recognitionIntervalRef.current);
      }
    };
  }, [mode, onError]);

  // Draw face detection box
  useEffect(() => {
    if (!isStreaming || !videoRef.current || !canvasRef.current) return;

    const drawLoop = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      try {
        const faceapi = await import('face-api.js');
        const detection = await faceapi.detectSingleFace(
          video,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
        );

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detection) {
          setFaceDetected(true);
          const box = detection.box;
          
          // Draw box
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 3;
          ctx.strokeRect(box.x, box.y, box.width, box.height);
          
          // Draw corners
          const cornerLength = 20;
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 4;
          
          // Top-left
          ctx.beginPath();
          ctx.moveTo(box.x, box.y + cornerLength);
          ctx.lineTo(box.x, box.y);
          ctx.lineTo(box.x + cornerLength, box.y);
          ctx.stroke();
          
          // Top-right
          ctx.beginPath();
          ctx.moveTo(box.x + box.width - cornerLength, box.y);
          ctx.lineTo(box.x + box.width, box.y);
          ctx.lineTo(box.x + box.width, box.y + cornerLength);
          ctx.stroke();
          
          // Bottom-left
          ctx.beginPath();
          ctx.moveTo(box.x, box.y + box.height - cornerLength);
          ctx.lineTo(box.x, box.y + box.height);
          ctx.lineTo(box.x + cornerLength, box.y + box.height);
          ctx.stroke();
          
          // Bottom-right
          ctx.beginPath();
          ctx.moveTo(box.x + box.width - cornerLength, box.y + box.height);
          ctx.lineTo(box.x + box.width, box.y + box.height);
          ctx.lineTo(box.x + box.width, box.y + box.height - cornerLength);
          ctx.stroke();
        } else {
          setFaceDetected(false);
        }
      } catch (error) {
        console.error('Error in draw loop:', error);
      }

      requestAnimationFrame(drawLoop);
    };

    drawLoop();
  }, [isStreaming]);

  // Handle enroll mode
  const handleEnroll = async () => {
    if (!videoRef.current || !faceDetected) return;

    try {
      setStatus('Menganalisis wajah...');
      const descriptor = await getFaceDescriptor(videoRef.current);
      
      if (!descriptor) {
        setStatus('Wajah tidak terdeteksi dengan jelas. Coba lagi.');
        return;
      }

      const newDescriptors = [...enrollDescriptors, descriptor];
      setEnrollDescriptors(newDescriptors);
      setEnrollCount(newDescriptors.length);

      if (newDescriptors.length >= 3) {
        // Average the descriptors for better accuracy
        const avgDescriptor = averageDescriptors(newDescriptors);
        setStatus('✅ Wajah berhasil didaftarkan!');
        if (onEnrollComplete) {
          onEnrollComplete(avgDescriptor);
        }
      } else {
        setStatus(`Scan ${3 - newDescriptors.length} kali lagi... (${newDescriptors.length}/3)`);
        // Auto capture next scan after 1 second
        setTimeout(() => {
          if (videoRef.current && faceDetected) {
            handleEnroll();
          }
        }, 1500);
      }
    } catch (error) {
      console.error('Error enrolling face:', error);
      setStatus('Error saat menganalisis wajah');
    }
  };

  // Handle recognize mode
  useEffect(() => {
    if (mode !== 'recognize' || !isStreaming || !pegawaiList) return;

    const recognizeLoop = async () => {
      if (!videoRef.current || !faceDetected) return;

      try {
        const result = await recognizeFace(videoRef.current, pegawaiList);
        
        if (result) {
          // Stop recognition
          if (recognitionIntervalRef.current) {
            clearInterval(recognitionIntervalRef.current);
          }
          setStatus(`✅ ${result.nama} terdeteksi!`);
          if (onRecognizeComplete) {
            onRecognizeComplete(result.pegawaiId, result.nama);
          }
        }
      } catch (error) {
        console.error('Error in recognition loop:', error);
      }
    };

    // Start recognition loop
    recognitionIntervalRef.current = setInterval(recognizeLoop, 1000);

    return () => {
      if (recognitionIntervalRef.current) {
        clearInterval(recognitionIntervalRef.current);
      }
    };
  }, [mode, isStreaming, faceDetected, pegawaiList, onRecognizeComplete]);

  // Average multiple face descriptors
  const averageDescriptors = (descriptors: number[][]): number[] => {
    const length = descriptors[0].length;
    const avg = new Array(length).fill(0);
    
    for (const desc of descriptors) {
      for (let i = 0; i < length; i++) {
        avg[i] += desc[i];
      }
    }
    
    for (let i = 0; i < length; i++) {
      avg[i] /= descriptors.length;
    }
    
    return avg;
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (recognitionIntervalRef.current) {
      clearInterval(recognitionIntervalRef.current);
    }
    setIsStreaming(false);
  };

  return (
    <div className="space-y-4">
      {/* Video Container */}
      <div className="relative rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
        <video
          ref={videoRef}
          className="w-full rounded-2xl"
          style={{ transform: 'scaleX(-1)' }} // Mirror effect
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
          style={{ transform: 'scaleX(-1)' }} // Mirror effect
        />
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="text-center text-white">
              <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm font-medium">{status}</p>
            </div>
          </div>
        )}

        {/* Status Overlay */}
        {!isLoading && (
          <div className="absolute top-3 left-3 right-3">
            <div className={`px-4 py-2 rounded-full glass text-white text-xs font-semibold text-center ${
              faceDetected ? 'border-green-400/50' : 'border-yellow-400/50'
            }`}>
              {faceDetected ? '✅ Wajah terdeteksi' : '⚠️ Wajah tidak terdeteksi'}
            </div>
          </div>
        )}

        {/* Enroll Progress */}
        {mode === 'enroll' && enrollCount > 0 && (
          <div className="absolute bottom-3 left-3 right-3">
            <div className="px-4 py-2 rounded-full glass text-white text-xs font-semibold text-center">
              Progress: {enrollCount}/3 scan
            </div>
          </div>
        )}
      </div>

      {/* Status Text */}
      {!isLoading && (
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">{status}</p>
          {mode === 'enroll' && pegawai && (
            <p className="text-xs text-gray-500 mt-1">Mendaftarkan wajah untuk: {pegawai.nama}</p>
          )}
          {mode === 'recognize' && (
            <p className="text-xs text-gray-500 mt-1">Posisikan wajah di tengah frame</p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {!isLoading && (
        <div className="flex gap-2">
          {mode === 'enroll' && (
            <button
              onClick={handleEnroll}
              disabled={!faceDetected || enrollCount >= 3}
              className="btn-futuristic flex-1 py-4 rounded-xl font-bold text-white tracking-wider uppercase text-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 10px 25px rgba(102, 126, 234, 0.4)',
              }}
            >
              {enrollCount >= 3 ? '✅ Selesai' : `📸 Scan Wajah (${enrollCount}/3)`}
            </button>
          )}
          
          <button
            onClick={stopCamera}
            className="btn-futuristic py-4 px-6 rounded-xl font-bold text-white tracking-wider uppercase text-sm transition-all hover:scale-[1.02] active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #dc2626, #ef4444)',
              boxShadow: '0 10px 25px rgba(220, 38, 38, 0.4)',
            }}
          >
            ⏹️ Stop
          </button>
        </div>
      )}
    </div>
  );
}
