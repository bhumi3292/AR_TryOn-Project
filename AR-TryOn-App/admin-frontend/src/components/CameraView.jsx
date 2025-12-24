import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";

// CameraView handles getUserMedia and exposes the video element via ref
const CameraView = forwardRef(function CameraView(props, ref) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);

  // Try multiple strategies to acquire the camera. Some platforms
  // fail when requesting high-res or exact constraints; we start
  // with a gentle request and fall back to broader constraints.
  const startCamera = async () => {
    setError(null);
    // helper to set stream and play
    const attachStream = async (stream) => {
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    };

    // 1) Try facingMode 'user' without exact resolution
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      await attachStream(s);
      return true;
    } catch (e1) {
      console.warn("camera attempt 1 failed", e1);
    }

    // 2) Try generic video (let browser pick)
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      await attachStream(s);
      return true;
    } catch (e2) {
      console.warn("camera attempt 2 failed", e2);
    }

    // 3) Try enumerating devices and request first available videoinput
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === "videoinput");
      for (const dev of videoInputs) {
        try {
          const s = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: dev.deviceId } },
            audio: false,
          });
          await attachStream(s);
          return true;
        } catch (ie) {
          console.warn(
            "device-specific attempt failed",
            dev.label || dev.deviceId,
            ie,
          );
          continue;
        }
      }
    } catch (enumErr) {
      console.warn("enumerateDevices failed", enumErr);
    }

    // If we reached here, all attempts failed
    const msg =
      "Unable to access camera. Close other apps using the camera, check OS/browser camera permissions, or try a different browser.";
    setError(msg);
    return false;
  };

  useEffect(() => {
    let mounted = true;
    // auto-start
    startCamera().catch((err) => {
      if (mounted) setError(err?.message || "Camera access denied");
    });

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  useImperativeHandle(ref, () => ({
    getVideo: () => videoRef.current,
    start: startCamera,
  }));

  // Camera container itself is controlled by parent for sizing; video fills it.
  return (
    <div className="relative w-full h-full bg-[var(--muted)] overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        autoPlay
        muted
      />

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-4">
          <div className="text-center text-sm lux-gold mb-4">{error}</div>
          <div className="flex gap-3">
            <button
              onClick={async () => {
                if (ref && ref.current && ref.current.start)
                  await ref.current.start();
              }}
              className="px-4 py-2 bg-[var(--gold)] text-[#0b0b0b] rounded"
            >
              Retry
            </button>
            <button
              onClick={() => setError(null)}
              className="px-4 py-2 lux-transparent-btn rounded"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default CameraView;
