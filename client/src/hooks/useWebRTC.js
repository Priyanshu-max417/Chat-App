import { useCallback, useEffect, useRef, useState } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const useWebRTC = (socket, userId) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callState, setCallState] = useState('idle');
  const [callType, setCallType] = useState('video');
  const [incomingCall, setIncomingCall] = useState(null);

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    peerRef.current?.close();
    peerRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setCallState('idle');
    setIncomingCall(null);
  }, []);

  const createPeer = useCallback(() => {
    const peer = new RTCPeerConnection(ICE_SERVERS);

    peer.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    peer.onicecandidate = (event) => {
      if (event.candidate && socket && userId) {
        socket.emit('call:ice-candidate', {
          toUserId: userId,
          candidate: event.candidate,
        });
      }
    };

    peerRef.current = peer;
    return peer;
  }, [socket, userId]);

  const getMedia = useCallback(async (type) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === 'video',
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  const startCall = useCallback(
    async (targetUserId, conversationId, type = 'video') => {
      if (!socket) return;

      setCallType(type);
      setCallState('calling');
      const stream = await getMedia(type);
      const peer = createPeer();
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socket.emit('call:offer', {
        toUserId: targetUserId,
        offer,
        conversationId,
        callType: type,
      });
    },
    [socket, getMedia, createPeer]
  );

  const answerCall = useCallback(
    async (offer, fromUserId, type) => {
      if (!socket) return;

      setCallType(type || 'video');
      setCallState('active');
      setIncomingCall(null);

      const stream = await getMedia(type || 'video');
      const peer = createPeer();
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit('call:answer', { toUserId: fromUserId, answer });
    },
    [socket, getMedia, createPeer]
  );

  const handleAnswer = useCallback(async (answer) => {
    if (peerRef.current) {
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      setCallState('active');
    }
  }, []);

  const handleIceCandidate = useCallback(async (candidate) => {
    if (peerRef.current && candidate) {
      await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }, []);

  const endCall = useCallback(() => {
    if (socket && userId) {
      socket.emit('call:end', { toUserId: userId });
    }
    cleanup();
  }, [socket, userId, cleanup]);

  const rejectCall = useCallback(() => {
    if (socket && incomingCall) {
      socket.emit('call:reject', { toUserId: incomingCall.fromUserId });
    }
    cleanup();
  }, [socket, incomingCall, cleanup]);

  useEffect(() => {
    if (!socket) return undefined;

    const onOffer = (data) => {
      setIncomingCall(data);
      setCallState('incoming');
    };

    const onAnswer = async (data) => {
      await handleAnswer(data.answer);
    };

    const onIce = async (data) => {
      await handleIceCandidate(data.candidate);
    };

    const onEnd = () => cleanup();
    const onReject = () => cleanup();

    socket.on('call:offer', onOffer);
    socket.on('call:answer', onAnswer);
    socket.on('call:ice-candidate', onIce);
    socket.on('call:end', onEnd);
    socket.on('call:reject', onReject);

    return () => {
      socket.off('call:offer', onOffer);
      socket.off('call:answer', onAnswer);
      socket.off('call:ice-candidate', onIce);
      socket.off('call:end', onEnd);
      socket.off('call:reject', onReject);
    };
  }, [socket, handleAnswer, handleIceCandidate, cleanup]);

  return {
    localStream,
    remoteStream,
    callState,
    callType,
    incomingCall,
    startCall,
    answerCall,
    endCall,
    rejectCall,
    cleanup,
  };
};
