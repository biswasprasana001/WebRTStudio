// Native WebRTC Peer Mesh & DataChannel Manager
// shortcut: Mesh topology is optimal for 2-4 peers; upgrade to SFU (e.g., LiveKit) for large conferences (>6 peers).

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export class StudioWebRTC {
  constructor(roomId, onRemoteStream, onPeerLeft, onDataMessage) {
    this.roomId = roomId;
    this.peerId = 'p_' + Math.random().toString(36).substring(2, 9);
    this.onRemoteStream = onRemoteStream;
    this.onPeerLeft = onPeerLeft;
    this.onDataMessage = onDataMessage;

    this.localStream = null;
    this.peers = new Map(); // peerId -> { pc, dc }
    this.ws = null;
    this.isScreenSharing = false;
    this.screenStream = null;
  }

  async initLocalMedia() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
    } catch (err) {
      console.warn('Could not acquire both video and audio, falling back to audio only:', err);
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (audioErr) {
        console.warn('No media devices available, running in data-only mode:', audioErr);
        this.localStream = new MediaStream();
      }
    }
    return this.localStream;
  }

  connectSignaling() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.ws.send(JSON.stringify({
        type: 'join',
        roomId: this.roomId,
        peerId: this.peerId
      }));
    };

    this.ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'peers-in-room') {
          // Initiate calls to all existing peers in the room
          for (const remotePeerId of msg.peers) {
            await this.callPeer(remotePeerId);
          }
        } else if (msg.type === 'peer-joined') {
          // Remote peer joined; they will call us as initiator
        } else if (msg.type === 'signal') {
          await this.handleSignal(msg.from, msg.data);
        } else if (msg.type === 'peer-left') {
          this.closePeer(msg.peerId);
          this.onPeerLeft(msg.peerId);
        }
      } catch (e) {
        console.error('Signaling message error:', e);
      }
    };
  }

  createPeerConnection(remotePeerId) {
    if (this.peers.has(remotePeerId)) return this.peers.get(remotePeerId).pc;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    let dc = null;

    // Add local media tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'signal',
          to: remotePeerId,
          data: { candidate: event.candidate }
        }));
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.onRemoteStream(remotePeerId, event.streams[0]);
      }
    };

    pc.ondatachannel = (event) => {
      this.setupDataChannel(remotePeerId, event.channel);
    };

    this.peers.set(remotePeerId, { pc, dc: null });
    return pc;
  }

  setupDataChannel(remotePeerId, channel) {
    const peerObj = this.peers.get(remotePeerId);
    if (peerObj) peerObj.dc = channel;

    const requestSync = () => {
      try {
        channel.send(JSON.stringify({ type: 'request-sync' }));
      } catch (err) {
        console.warn('Sync request failed:', err);
      }
    };

    if (channel.readyState === 'open') {
      requestSync();
    } else {
      channel.onopen = requestSync;
    }

    channel.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        this.onDataMessage(data, remotePeerId);
      } catch (err) {
        console.error('DataChannel parse error:', err);
      }
    };
  }

  async callPeer(remotePeerId) {
    const pc = this.createPeerConnection(remotePeerId);
    // Initiator creates data channel
    const dc = pc.createDataChannel('studio-data');
    this.setupDataChannel(remotePeerId, dc);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    this.ws.send(JSON.stringify({
      type: 'signal',
      to: remotePeerId,
      data: { sdp: pc.localDescription }
    }));
  }

  async handleSignal(fromPeerId, data) {
    const pc = this.createPeerConnection(fromPeerId);

    if (data.sdp) {
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      if (data.sdp.type === 'offer') {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.ws.send(JSON.stringify({
          type: 'signal',
          to: fromPeerId,
          data: { sdp: pc.localDescription }
        }));
      }
    } else if (data.candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.warn('Error adding ice candidate:', err);
      }
    }
  }

  broadcastData(data) {
    const payload = JSON.stringify(data);
    for (const [, { dc }] of this.peers) {
      if (dc && dc.readyState === 'open') {
        dc.send(payload);
      }
    }
  }

  sendToPeer(peerId, data) {
    const peerObj = this.peers.get(peerId);
    if (peerObj?.dc?.readyState === 'open') {
      peerObj.dc.send(JSON.stringify(data));
    }
  }

  toggleAudio(enabled) {
    if (!this.localStream) return false;
    this.localStream.getAudioTracks().forEach((t) => (t.enabled = enabled));
    return enabled;
  }

  toggleVideo(enabled) {
    if (!this.localStream) return false;
    this.localStream.getVideoTracks().forEach((t) => (t.enabled = enabled));
    return enabled;
  }

  async toggleScreenShare() {
    if (this.isScreenSharing) {
      // Revert to camera track
      const camTrack = this.localStream.getVideoTracks()[0];
      for (const [, { pc }] of this.peers) {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender && camTrack) sender.replaceTrack(camTrack);
      }
      if (this.screenStream) {
        this.screenStream.getTracks().forEach((t) => t.stop());
        this.screenStream = null;
      }
      this.isScreenSharing = false;
      return false;
    } else {
      try {
        this.screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = this.screenStream.getVideoTracks()[0];

        screenTrack.onended = () => {
          this.toggleScreenShare(); // Auto-revert when user stops sharing via browser bar
        };

        for (const [, { pc }] of this.peers) {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        }
        this.isScreenSharing = true;
        return true;
      } catch (err) {
        console.warn('Screen share canceled or denied:', err);
        return false;
      }
    }
  }

  closePeer(peerId) {
    if (this.peers.has(peerId)) {
      const { pc, dc } = this.peers.get(peerId);
      if (dc) dc.close();
      if (pc) pc.close();
      this.peers.delete(peerId);
    }
  }

  destroy() {
    for (const peerId of this.peers.keys()) {
      this.closePeer(peerId);
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
    }
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((t) => t.stop());
    }
    if (this.ws) {
      this.ws.close();
    }
  }
}
