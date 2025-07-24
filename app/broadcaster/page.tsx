'use client';
import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

export default function Broadcaster() {
  const socket = useRef<any>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    socket.current = io('http://localhost:3001');
  }, []);

  const startBroadcast = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    if (videoRef.current) videoRef.current.srcObject = stream;

    pc.current = new RTCPeerConnection();
    stream.getTracks().forEach(track => pc.current?.addTrack(track, stream));

    pc.current.onicecandidate = e => {
      if (e.candidate) {
        socket.current.emit('ice-candidate', e.candidate);
      }
    };

    const offer = await pc.current.createOffer();
    await pc.current.setLocalDescription(offer);
    socket.current.emit('offer', offer);

    socket.current.on('answer', async (answer: RTCSessionDescriptionInit) => {
      await pc.current?.setRemoteDescription(answer);
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Screen Broadcaster</h1>
      <button
        onClick={startBroadcast}
        className="px-4 py-2 bg-green-600 text-white rounded mb-4"
      >
        Start Broadcast
      </button>
      <video ref={videoRef} autoPlay muted className="w-full max-w-3xl border rounded" />
    </div>
  );
}
