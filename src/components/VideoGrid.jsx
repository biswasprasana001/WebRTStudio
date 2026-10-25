import { useEffect, useRef, useState } from 'preact/hooks';

export function VideoGrid({ webrtc, localStream, remoteStreams }) {
  const localVideoRef = useRef(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const toggleMic = () => {
    const next = !micOn;
    webrtc.toggleAudio(next);
    setMicOn(next);
  };

  const toggleCam = () => {
    const next = !camOn;
    webrtc.toggleVideo(next);
    setCamOn(next);
  };

  const toggleShare = async () => {
    const isNowSharing = await webrtc.toggleScreenShare();
    setSharing(isNowSharing);
  };

  return (
    <div class="video-grid-container">
      <div class="video-tiles">
        <div class="video-card local-tile">
          <video ref={localVideoRef} autoPlay playsInline muted class="video-feed" />
          <span class="video-label">You {sharing ? '(Sharing Screen)' : ''}</span>
        </div>

        {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
          <RemoteVideoCard key={peerId} peerId={peerId} stream={stream} />
        ))}
      </div>

      <div class="video-controls">
        <button class={`btn-control ${!micOn ? 'btn-danger' : ''}`} onClick={toggleMic} title="Toggle Microphone">
          {micOn ? '🎤 Mic On' : '🔇 Muted'}
        </button>
        <button class={`btn-control ${!camOn ? 'btn-danger' : ''}`} onClick={toggleCam} title="Toggle Camera">
          {camOn ? '📷 Cam On' : '🚫 Cam Off'}
        </button>
        <button class={`btn-control ${sharing ? 'btn-active' : ''}`} onClick={toggleShare} title="Toggle Screen Share">
          {sharing ? '🛑 Stop Share' : '🖥️ Share Screen'}
        </button>
      </div>
    </div>
  );
}

function RemoteVideoCard({ peerId, stream }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div class="video-card remote-tile">
      <video ref={videoRef} autoPlay playsInline class="video-feed" />
      <span class="video-label">Peer ({peerId.substring(0, 5)})</span>
    </div>
  );
}
