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
  dataUrl?: string;
  durationSeconds: number;
  timestamp: string;
  filename: string;
  mimeType: string;
}

/**
 * Detects the best supported video container and codec for maximum compatibility.
 */
export function getSupportedVideoFormat(): { mimeType: string; extension: 'mp4' | 'webm' } {
  // 1. Try MP4 formats (highly compatible with Windows Media Player, QuickTime, iOS, Android, macOS)
  const mp4Types = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/mp4;codecs=h264',
    'video/mp4'
  ];
  for (const type of mp4Types) {
    if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(type)) {
      return { mimeType: type, extension: 'mp4' };
    }
  }

  // 2. Try WebM formats (universally supported across Chrome, Firefox, Edge, Safari 14+)
  const webmTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264',
    'video/webm'
  ];
  for (const type of webmTypes) {
    if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(type)) {
      return { mimeType: type, extension: 'webm' };
    }
  }

  return { mimeType: 'video/webm', extension: 'webm' };
}

/**
 * Converts a Blob to a Base64 data URL string for storage.
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Converts a Base64 data URL string back to a valid binary Blob.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'video/webm';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
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

    // Determine best supported mime type & container
    const { mimeType: chosenMime } = getSupportedVideoFormat();
    const options: MediaRecorderOptions = chosenMime ? { mimeType: chosenMime } : {};
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
  } catch (err: any) {
    console.error('Screen recording start error:', err);
    activeSession = null;
    throw err;
  }
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
    mediaRecorder.onstop = async () => {
      const durationSeconds = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
      const now = new Date();
      const dateTag = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);

      const mimeType = mediaRecorder.mimeType || 'video/webm';
      const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const filename = `Screen_Recording_${dateTag}.${extension}`;

      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);

      // Stop all tracks in stream
      if (stream) {
        try {
          stream.getTracks().forEach(track => track.stop());
        } catch (_) {}
      }

      activeSession = null;

      // Generate Data URL for permanent filesystem persistence
      let dataUrl: string | undefined = undefined;
      try {
        dataUrl = await blobToDataUrl(blob);
      } catch (e) {
        console.warn('Could not generate base64 dataUrl for video:', e);
      }

      const result: RecordingResult = {
        blob,
        url,
        dataUrl,
        durationSeconds,
        timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        filename,
        mimeType
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
 * Trigger browser file download of recording blob with accurate MIME and extension.
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
    try {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (_) {}
  }, 500);
}

/**
 * Universal video file downloader that guarantees a valid binary video file (never plain text)
 */
export function downloadVideoFile(filename: string, content?: string): boolean {
  // 1. Try registry for existing memory Blob
  const rec = getRecordingResult(filename);
  if (rec && rec.blob) {
    downloadRecordingBlob(rec.blob, filename);
    return true;
  }

  // 2. Try Base64 data URL
  if (content && content.startsWith('data:video/')) {
    try {
      const blob = dataUrlToBlob(content);
      downloadRecordingBlob(blob, filename);
      return true;
    } catch (e) {
      console.warn('Failed to parse base64 video data URL:', e);
    }
  }

  // 3. Try content containing direct URL
  const videoUrl = getVideoUrlForFile(filename, content);
  if (videoUrl) {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        document.body.removeChild(a);
      } catch (_) {}
    }, 500);
    return true;
  }

  return false;
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

