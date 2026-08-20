import html2canvas from 'html2canvas';

export interface ScreenCaptureResult {
  dataUrl: string;
  source: 'dom' | 'displayMedia' | 'canvas_fallback';
  activeApp?: string;
  openApps?: string[];
}

/**
 * Captures the current Lumina OS desktop workspace and any active windows.
 */
export async function captureDesktopDOM(targetId = 'lumina-desktop-stage'): Promise<string | null> {
  try {
    const targetElement = document.getElementById(targetId) || document.getElementById('lumina-desktop-container') || document.body;
    if (!targetElement) return null;

    // Use html2canvas with performance optimizations (scale 0.65 for fast capture and low payload)
    const canvas = await html2canvas(targetElement as HTMLElement, {
      scale: 0.65,
      logging: false,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#0a0e1a',
      ignoreElements: (el) => {
        return el.classList.contains('ai-vision-ignore') || el.id === 'lumina-screen-vision-hud';
      }
    });

    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (error) {
    console.warn('DOM capture warning, falling back to canvas renderer:', error);
    return createDesktopCanvasFallback();
  }
}

/**
 * Creates a synthetic desktop schematic snapshot fallback if DOM cloning is restricted by browser sandbox.
 */
export function createDesktopCanvasFallback(activeApp = 'Paint Studio', openApps: string[] = []): string {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 640, 360);
  gradient.addColorStop(0, '#0f172a');
  gradient.addColorStop(1, '#020617');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 640, 360);

  // Top Bar
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fillRect(0, 0, 640, 24);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('LUMINA.OS SCREEN SHARE ACTIVE', 12, 16);

  // Active App Window Box
  ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
  ctx.strokeStyle = 'rgba(147, 51, 234, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(60, 40, 520, 280, 8);
  ctx.fill();
  ctx.stroke();

  // Active Window Header
  ctx.fillStyle = '#9333ea';
  ctx.fillRect(60, 40, 520, 24);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(`Active Window: ${activeApp}`, 72, 56);

  // Open Apps info
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px monospace';
  ctx.fillText(`Open Apps: ${openApps.length > 0 ? openApps.join(', ') : activeApp}`, 72, 85);
  ctx.fillText('Lumina AI Multimodal Vision Analysis', 72, 105);

  return canvas.toDataURL('image/jpeg', 0.8);
}

/**
 * Grabs a single frame from a live MediaStream (WebRTC getDisplayMedia)
 */
export async function captureStreamFrame(stream: MediaStream): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack || videoTrack.readyState !== 'live') {
        resolve(null);
        return;
      }

      const video = document.createElement('video');
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;

      video.onloadedmetadata = () => {
        video.play().then(() => {
          setTimeout(() => {
            const canvas = document.createElement('canvas');
            canvas.width = Math.min(1280, video.videoWidth || 640);
            canvas.height = Math.min(720, video.videoHeight || 360);
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              resolve(canvas.toDataURL('image/jpeg', 0.8));
            } else {
              resolve(null);
            }
            video.srcObject = null;
          }, 100);
        }).catch(() => resolve(null));
      };

      video.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}
