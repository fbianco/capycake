// ---------------------------------------------------------------------------
// HandTracker: webcam -> MediaPipe Hand Landmarker -> up to 2 hands.
//
// Same approach as Unicorn Run's PoseTracker: the MediaPipe library
// (JavaScript + WebAssembly) ships inside the project in vendor/mediapipe.
// The hand model is loaded from models/hand_landmarker.task when present
// (start.bat downloads it the first time), otherwise straight from Google's
// public model storage. Video never leaves the computer.
// ---------------------------------------------------------------------------
import { CAM } from '../config.js';

const LIB = new URL('../../vendor/mediapipe/vision_bundle.mjs', import.meta.url).href;
const WASM = new URL('../../vendor/mediapipe/wasm', import.meta.url).href;
const MODEL_LOCAL = new URL('../../models/hand_landmarker.task', import.meta.url).href;
export const MODEL_REMOTE = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

// hand skeleton lines (pairs of landmark indices)
const BONES = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
];

export class HandTracker {
  constructor(video) {
    this.video = video;
    this.status = 'idle'; // idle | camera | model | ready | error
    this.message = 'Camera off';
    this.landmarker = null;
    this.lastVideoTime = -1;
    this.latest = [];
    this.fps = 0;
    this.lastDetectAt = 0;
  }

  get ready() {
    return this.status === 'ready';
  }

  async start() {
    if (this.status === 'camera' || this.status === 'model') return;
    try {
      this.status = 'camera';
      this.message = 'Waiting for camera permission...';
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser has no camera API');
      if (!this.video.srcObject) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: CAM.width }, height: { ideal: CAM.height }, facingMode: 'user' },
          audio: false,
        });
        this.video.srcObject = stream;
      }
      await this.video.play();

      this.status = 'model';
      this.message = 'Loading hand tracking...';
      if (!this.landmarker) {
        const vision = await import(LIB);
        const fileset = await vision.FilesetResolver.forVisionTasks(WASM);
        const modelAssetPath = await pickModel();
        const options = (delegate) => ({
          baseOptions: { modelAssetPath, delegate },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        // add ?delegate=CPU to the address to skip the graphics card
        const forced = new URLSearchParams(location.search).get('delegate');
        try {
          this.landmarker = await vision.HandLandmarker.createFromOptions(fileset, options(forced === 'CPU' ? 'CPU' : 'GPU'));
        } catch (gpuError) {
          console.warn('GPU delegate failed, using CPU', gpuError);
          this.landmarker = await vision.HandLandmarker.createFromOptions(fileset, options('CPU'));
        }
      }
      this.status = 'ready';
      this.message = 'Paw control ON';
    } catch (err) {
      console.error(err);
      this.status = 'error';
      this.message = friendlyError(err);
    }
  }

  get aspect() {
    const v = this.video;
    return v.videoWidth && v.videoHeight ? v.videoWidth / v.videoHeight : 16 / 9;
  }

  /**
   * Run the detector on the newest camera frame. Returns the list of hands
   * (each 21 landmarks), or undefined when there is no new camera frame.
   */
  detect(nowMs) {
    if (!this.ready || this.video.readyState < 2) return undefined;
    if (this.video.currentTime === this.lastVideoTime) return undefined;
    this.lastVideoTime = this.video.currentTime;
    const result = this.landmarker.detectForVideo(this.video, nowMs);
    if (this.lastDetectAt) this.fps = this.fps * 0.9 + (1000 / Math.max(1, nowMs - this.lastDetectAt)) * 0.1;
    this.lastDetectAt = nowMs;
    this.latest = result.landmarks ?? [];
    return this.latest;
  }

  /** Draw the mirrored camera picture with the hands into a box of the game canvas. */
  drawInset(g, x, y, w, h, paws, colors) {
    const v = this.video;
    g.save();
    g.beginPath();
    g.roundRect(x, y, w, h, 14);
    g.clip();
    g.fillStyle = '#3b2a3f';
    g.fillRect(x, y, w, h);
    if (v.readyState >= 2 && v.videoWidth) {
      // cover the box, mirrored
      const va = v.videoWidth / v.videoHeight;
      const ba = w / h;
      let sw = v.videoWidth;
      let sh = v.videoHeight;
      if (va > ba) sw = sh * ba; else sh = sw / ba;
      const sx = (v.videoWidth - sw) / 2;
      const sy = (v.videoHeight - sh) / 2;
      g.translate(x + w, y);
      g.scale(-1, 1);
      g.globalAlpha = 0.85;
      g.drawImage(v, sx, sy, sw, sh, 0, 0, w, h);
      g.globalAlpha = 1;
      // the part of the picture that covers the whole game screen
      const px = (n) => ((n * v.videoWidth - sx) / sw) * w;
      const py = (n) => ((n * v.videoHeight - sy) / sh) * h;
      g.setLineDash([6, 5]);
      g.lineWidth = 2;
      g.strokeStyle = 'rgba(255,255,255,0.7)';
      g.strokeRect(px(1 - CAM.x1), py(CAM.y0), px(1 - CAM.x0) - px(1 - CAM.x1), py(CAM.y1) - py(CAM.y0));
      g.setLineDash([]);
      for (const paw of paws) {
        const lm = paw.lm;
        if (!lm) continue;
        const col = colors[paw.index];
        g.lineCap = 'round';
        g.lineWidth = 3;
        g.strokeStyle = col;
        for (const [a, b] of BONES) {
          g.beginPath();
          g.moveTo(px(lm[a].x), py(lm[a].y));
          g.lineTo(px(lm[b].x), py(lm[b].y));
          g.stroke();
        }
        g.fillStyle = paw.fist ? '#ffffff' : col;
        for (const i of [4, 8, 12, 16, 20]) {
          g.beginPath();
          g.arc(px(lm[i].x), py(lm[i].y), 3.5, 0, Math.PI * 2);
          g.fill();
        }
      }
    }
    g.restore();
  }
}

async function pickModel() {
  try {
    const r = await fetch(MODEL_LOCAL, { method: 'HEAD' });
    if (r.ok) return MODEL_LOCAL;
  } catch { /* not there */ }
  return MODEL_REMOTE;
}

function friendlyError(err) {
  const name = err?.name ?? '';
  if (name === 'NotAllowedError') return 'Camera blocked - allow it in the browser, then press R';
  if (name === 'NotFoundError') return 'No webcam found - mouse mode';
  if (name === 'NotReadableError') return 'Webcam busy in another app - close it, then press R';
  if (location.protocol === 'file:') return 'Start the game with start.bat (not by double-clicking index.html)';
  if (/fetch|network|load/i.test(err?.message ?? '')) return 'Hand model missing: go online once and press R - mouse mode';
  return 'Hand tracking unavailable (' + (err?.message ?? err) + ') - mouse mode';
}
