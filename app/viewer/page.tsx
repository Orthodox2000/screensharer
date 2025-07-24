'use client';
import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

export default function Viewer() {
  const socket = useRef<any>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    socket.current = io('http://localhost:3001');

    socket.current.on('offer', async (offer: RTCSessionDescriptionInit) => {
      pc.current = new RTCPeerConnection();

      pc.current.ontrack = (event) => {
        if (videoRef.current) videoRef.current.srcObject = event.streams[0];
      };

      pc.current.onicecandidate = e => {
        if (e.candidate) {
          socket.current.emit('ice-candidate', e.candidate);
        }
      };

      await pc.current.setRemoteDescription(offer);
      const answer = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answer);
      socket.current.emit('answer', answer);
    });

    socket.current.on('ice-candidate', async (candidate: RTCIceCandidateInit) => {
      try {
        await pc.current?.addIceCandidate(candidate);
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    });
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Live Viewer</h1>
      <video ref={videoRef} autoPlay controls className="w-full max-w-3xl border rounded" />
    </div>
  );
}
