import { captureDesktopDOM } from './screenCapture';

export interface RecordingSession {
  mediaRecorder: MediaRecorder | null;
  stream: MediaStream | null;
  chunks: Blob[];
  startTime: number;
  timerInterval: number | null;
  canvasStreamInterval?: number | null;
}

let activeSession: RecordingSession | null = null;

export interface RecordingResult {
  blob: Blob;
  url: string;
  durationSeconds: number;
  timestamp: string;
  filename: string;
}

/**
 * Starts a screen recording session.
 * Tries real browser navigator.mediaDevices.getDisplayMedia first.
 * If running in an iframe or permission is rejected, falls back to DOM canvas streaming.
 */
export async function startScreenRecording(
  onTimeUpdate?: (seconds: number) => void,
  onAutoStop?: (result: RecordingResult) => void
): Promise<{ success: boolean; mode: 'displayMedia' | 'canvas' }> {
  // If already recording, return
  if (activeSession) {
    return { success: true, mode: 'displayMedia' };
  }

  const chunks: Blob[] = [];
  let stream: MediaStream | null = null;
  let mode: 'displayMedia' | 'canvas' = 'displayMedia';
  let canvasStreamInterval: number | null = null;

  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always',
            displaySurface: 'monitor',
          } as any,
          audio: false,
        });
        mode = 'displayMedia';
      } catch (displayErr) {
        console.warn('getDisplayMedia unavailable or cancelled, falling back to Canvas stream:', displayErr);
        stream = null;
      }
    }
  } catch (e) {
    console.warn('Error accessing getDisplayMedia:', e);
  }

  // Fallback: Virtual Canvas Stream if getDisplayMedia is not available or blocked in iframe
  if (!stream) {
    mode = 'canvas';
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    
    // Create MediaStream from canvas at 20fps
    stream = canvas.captureStream(20);

    const drawFrame = async () => {
      if (!ctx || !activeSession) return;
      try {
        const frameDataUrl = await captureDesktopDOM('lumina-desktop-workstage');
        if (frameDataUrl) {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Add a subtle recording watermark
            ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
            ctx.beginPath();
            ctx.arc(24, 24, 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px monospace';
            ctx.fillText('REC - LUMINA OS', 38, 28);
          };
          img.src = frameDataUrl;
        }
      } catch (err) {
        console.warn('Canvas frame capture error:', err);
      }
    };

    // Draw initial frame immediately
    drawFrame();
    canvasStreamInterval = window.setInterval(drawFrame, 200);
  }

  // Determine supported mime type
  const mimeTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4'
  ];
  const selectedMime = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';

  const options: MediaRecorderOptions = selectedMime ? { mimeType: selectedMime } : {};
  const mediaRecorder = new MediaRecorder(stream, options);

  mediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  const startTime = Date.now();
  let timerInterval: number | null = window.setInterval(() => {
    const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
    if (onTimeUpdate) onTimeUpdate(elapsedSec);
  }, 1000);

  activeSession = {
    mediaRecorder,
    stream,
    chunks,
    startTime,
    timerInterval,
    canvasStreamInterval
  };

  // If user clicks "Stop Sharing" on browser's native bar
  stream.getVideoTracks()[0].onended = () => {
    if (activeSession) {
      stopScreenRecording().then(res => {
        if (res && onAutoStop) onAutoStop(res);
      });
    }
  };

  mediaRecorder.start(500); // chunk every 500ms
  return { success: true, mode };
}

/**
 * Stops the screen recording and returns the final video recording result.
 */
export async function stopScreenRecording(): Promise<RecordingResult | null> {
  if (!activeSession || !activeSession.mediaRecorder) {
    return null;
  }

  const { mediaRecorder, stream, chunks, startTime, timerInterval, canvasStreamInterval } = activeSession;

  if (timerInterval) clearInterval(timerInterval);
  if (canvasStreamInterval) clearInterval(canvasStreamInterval);

  return new Promise((resolve) => {
    mediaRecorder.onstop = () => {
      const durationSeconds = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
      const now = new Date();
      const dateTag = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `Screen_Recording_${dateTag}.webm`;

      const mimeType = mediaRecorder.mimeType || 'video/webm';
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);

      // Stop all tracks in stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      activeSession = null;

      const result: RecordingResult = {
        blob,
        url,
        durationSeconds,
        timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        filename
      };

      saveRecordingResult(result);
      resolve(result);
    };

    if (mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    } else {
      activeSession = null;
      resolve(null);
    }
  });
}

/**
 * Check if recording is currently active.
 */
export function isRecordingActive(): boolean {
  return activeSession !== null && activeSession.mediaRecorder?.state === 'recording';
}

/**
 * Trigger browser file download of recording blob.
 */
export function downloadRecordingBlob(blob: Blob, filename = 'Screen_Recording.webm') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Formats seconds into MM:SS display format.
 */
export function formatRecordingDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// In-memory persistent registry for video recordings across app sessions
const savedRecordingsMap = new Map<string, RecordingResult>();

export function saveRecordingResult(result: RecordingResult): void {
  savedRecordingsMap.set(result.filename, result);
  try {
    // Also save metadata to sessionStorage if possible
    const metaList = Array.from(savedRecordingsMap.entries()).map(([k, v]) => ({
      filename: v.filename,
      durationSeconds: v.durationSeconds,
      timestamp: v.timestamp
    }));
    sessionStorage.setItem('lumina_recordings_meta', JSON.stringify(metaList));
  } catch (_) {}
}

export function getRecordingResult(filename: string): RecordingResult | undefined {
  return savedRecordingsMap.get(filename);
}

export function getAllSavedRecordings(): RecordingResult[] {
  return Array.from(savedRecordingsMap.values());
}

/**
 * Returns a playable video URL for a file node if available
 */
export function getVideoUrlForFile(filename: string, content?: string): string | null {
  // 1. Check registry
  const saved = savedRecordingsMap.get(filename);
  if (saved && saved.url) {
    return saved.url;
  }

  // 2. Check if content is a direct blob or data url
  if (content && (content.startsWith('blob:') || content.startsWith('data:video/'))) {
    return content;
  }

  // 3. Check if content has an embedded URL string (from createFile metadata)
  if (content && content.includes('URL: blob:')) {
    const match = content.match(/URL:\s*(blob:[^\s\n]+)/);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

