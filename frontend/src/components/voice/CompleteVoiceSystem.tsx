import React, { useEffect, useRef, useState, useCallback } from 'react';
import Peer from 'peerjs';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
    collection,
    doc,
    onSnapshot,
    updateDoc,
    serverTimestamp,
    setDoc,
    deleteDoc,
    query,
    where
} from 'firebase/firestore';
import { db } from '../../firebase';
import {
    FaMicrophone,
    FaMicrophoneSlash,
    FaHeadphones,
    FaHeadphonesAlt,
    FaVolumeUp,
    FaVolumeMute,
    FaEllipsisV,
    FaUser,
    FaUsers,
    FaHandPaper,
    FaRecordVinyl,
    FaStop,
    FaCog,
    FaSignal,
    FaSignInAlt,
    FaSignOutAlt
} from 'react-icons/fa';

interface VoiceParticipant {
    id: string;
    peerId: string;
    name: string;
    avatar?: string;
    muted: boolean;
    deafened: boolean;
    speaking: boolean;
    volume: number;
    handRaised: boolean;
    role: 'host' | 'participant' | 'listener';
    joinedAt: Date;
}

interface VoiceChannel {
    id: string;
    name: string;
    type: 'general' | 'breakout' | 'private';
    participants: string[];
    maxParticipants: number;
}

interface VoiceSettings {
    inputDeviceId: string;
    outputDeviceId: string;
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
}

const CompleteVoiceSystem: React.FC<{
    sessionId: string;
    userId: string;
    userName: string;
    currentChannel?: string;
}> = ({
    sessionId,
    userId,
    userName,
    currentChannel
}) => {
        const [peer, setPeer] = useState<Peer | null>(null);
        const [myStream, setMyStream] = useState<MediaStream | null>(null);
        const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
        const [channels, setChannels] = useState<VoiceChannel[]>([]);
        const [activeChannel, setActiveChannel] = useState<string | null>(null);
        const [isMuted, setIsMuted] = useState(false);
        const [isDeafened, setIsDeafened] = useState(false);
        const [isRecording, setIsRecording] = useState(false);
        const [settings, setSettings] = useState<VoiceSettings>({
            inputDeviceId: 'default',
            outputDeviceId: 'default',
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        });
        const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
        const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
        const [showSettings, setShowSettings] = useState(false);
        const [audioLevel, setAudioLevel] = useState(0);

        const audioContextRef = useRef<AudioContext | null>(null);
        const analyserRef = useRef<AnalyserNode | null>(null);
        const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
        const peerConnectionsRef = useRef<Map<string, any>>(new Map());
        const mediaRecorderRef = useRef<MediaRecorder | null>(null);
        const audioChunksRef = useRef<Blob[]>([]);

        // Sync external channel prop
        useEffect(() => {
            if (currentChannel && currentChannel !== activeChannel && peer) {
                joinChannel(currentChannel);
            }
        }, [currentChannel, peer]);

        // Initialize PeerJS and Audio
        useEffect(() => {
            const initPeer = async () => {
                try {
                    const newPeer = new Peer(userId, {
                        host: process.env.REACT_APP_PEER_HOST || 'localhost',
                        port: parseInt(process.env.REACT_APP_PEER_PORT || '9000'),
                        path: '/myapp',
                        config: {
                            iceServers: [
                                {
                                    urls: process.env.REACT_APP_TURN_URL || 'stun:stun.l.google.com:19302'
                                }
                            ]
                        }
                    });

                    newPeer.on('open', (id) => {
                        console.log('My peer ID is: ' + id);
                        setPeer(newPeer);
                        joinChannel(currentChannel || 'general'); // Auto-join channel
                    });

                    newPeer.on('call', (call) => {
                        if (isDeafened) {
                            call.close();
                            return;
                        }

                        if (myStreamRef.current) {
                            call.answer(myStreamRef.current);
                            call.on('stream', (remoteStream) => {
                                handleRemoteStream(call.peer, remoteStream);
                            });
                            peerConnectionsRef.current.set(call.peer, call);
                        } else {
                            navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
                                call.answer(stream);
                                call.on('stream', (remoteStream) => {
                                    handleRemoteStream(call.peer, remoteStream);
                                });
                                peerConnectionsRef.current.set(call.peer, call);
                            }).catch(e => console.error("Could not get stream to answer", e));
                        }
                    });

                    newPeer.on('error', (err) => {
                        console.error('Peer error:', err);
                        if (err.type === 'peer-unavailable') {
                            // silently ignore or retry
                        } else {
                            toast.error(`Voice error: ${err.type}`);
                        }
                    });

                } catch (error) {
                    console.error('Failed to initialize voice:', error);
                    toast.error('Failed to initialize voice system');
                }
            };

            // Load devices
            navigator.mediaDevices.enumerateDevices().then(devices => {
                setInputDevices(devices.filter(d => d.kind === 'audioinput'));
                setOutputDevices(devices.filter(d => d.kind === 'audiooutput'));
            });

            initPeer();

            return () => {
                myStream?.getTracks().forEach(track => track.stop());
                peer?.destroy();
                audioContextRef.current?.close();
                // Cleanup audio elements by removing them
                document.querySelectorAll('audio[id^="audio-"]').forEach(el => el.remove());
            };
        }, [userId]);

        // Ref for stream to access in callbacks to avoid stale closures
        const myStreamRef = useRef<MediaStream | null>(null);
        useEffect(() => { myStreamRef.current = myStream; }, [myStream]);

        // Handle local audio stream
        useEffect(() => {
            if (!activeChannel) return;

            let activeStream: MediaStream | null = null;
            let animationFrameId: number;

            const startLocalStream = async () => {
                try {
                    // Ensure previous stream is stopped
                    if (myStreamRef.current) {
                        myStreamRef.current.getTracks().forEach(t => t.stop());
                    }

                    const stream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            deviceId: settings.inputDeviceId !== 'default' ? { exact: settings.inputDeviceId } : undefined,
                            echoCancellation: settings.echoCancellation,
                            noiseSuppression: settings.noiseSuppression,
                            autoGainControl: settings.autoGainControl
                        },
                        video: false
                    });

                    activeStream = stream;
                    setMyStream(stream);

                    // Initialize Audio Context for Visualizer
                    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                    const audioContext = new AudioContextClass();

                    // Resume context if suspended (common browser policy issue)
                    if (audioContext.state === 'suspended') {
                        await audioContext.resume();
                    }

                    audioContextRef.current = audioContext;

                    const analyser = audioContext.createAnalyser();
                    analyser.fftSize = 256;
                    analyser.smoothingTimeConstant = 0.8;

                    const source = audioContext.createMediaStreamSource(stream);
                    source.connect(analyser);
                    analyserRef.current = analyser;

                    // Monitor volume with improved sensitivity
                    const checkAudioLevel = () => {
                        if (!analyser) return;
                        const dataArray = new Uint8Array(analyser.frequencyBinCount);
                        analyser.getByteFrequencyData(dataArray);

                        // distinct calculation to focus on speech frequencies (roughly 85-255Hz range in simple FFT)
                        // or just average for simplicity but normalized
                        const values = dataArray.reduce((a, b) => a + b, 0);
                        const average = values / dataArray.length;

                        // Normalize to 0-100 range roughly
                        // Typical speech might average 30-50 in raw byte data, so multiply
                        setAudioLevel(Math.min(100, average * 2));

                        if (average > 10) { // Lower threshold for "speaking" status
                            updateParticipantStatus({ speaking: true });
                        } else {
                            updateParticipantStatus({ speaking: false });
                        }

                        animationFrameId = requestAnimationFrame(checkAudioLevel);
                    };
                    checkAudioLevel();

                    // Replace tracks in existing calls
                    peerConnectionsRef.current.forEach((call: any) => {
                        const audioTrack = stream.getAudioTracks()[0];
                        if (call.peerConnection) {
                            const sender = call.peerConnection.getSenders().find((s: any) => s.track?.kind === 'audio');
                            if (sender) sender.replaceTrack(audioTrack);
                        }
                    });

                } catch (error) {
                    console.error('Error accessing microphone:', error);
                    toast.error('Could not access microphone. Please check permissions.');
                }
            };

            startLocalStream();

            return () => {
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
                if (activeStream) activeStream.getTracks().forEach(t => t.stop());
            };
        }, [activeChannel, settings.inputDeviceId, settings.echoCancellation]);

        // Connect to other participants in the channel - slightly optimized
        useEffect(() => {
            if (!peer || !activeChannel || !myStream) return;

            const peersToCall = participants.filter(p => p.id !== userId && (p as any).channelId === activeChannel);

            peersToCall.forEach(participant => {
                if (!peerConnectionsRef.current.has(participant.peerId)) {
                    // console.log("Calling", participant.peerId);
                    const call = peer.call(participant.peerId, myStream);
                    call.on('stream', (remoteStream) => {
                        handleRemoteStream(participant.id, remoteStream);
                    });
                    peerConnectionsRef.current.set(participant.peerId, call);
                }
            });
        }, [participants, activeChannel, peer, myStream]);

        // ... (Firestore listeners stay same, handled by target content match or just kept) ...
        // Note: The replacement instruction covered lines 120-362 which includes everything. 
        // I need to ensure I don't delete the FS listeners if they were in that range.
        // Lines 242-278 were Firestore listeners. I must include them or I will delete them.

        // Firestore listeners (Included to preserve them)
        useEffect(() => {
            const q = query(
                collection(db, 'sessions', sessionId, 'voice_participants'),
                where('online', '==', true)
            );
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const parts: VoiceParticipant[] = [];
                snapshot.forEach(doc => {
                    parts.push({ id: doc.id, ...doc.data() } as VoiceParticipant);
                });
                setParticipants(parts);
            });
            return () => unsubscribe();
        }, [sessionId]);

        useEffect(() => {
            const q = collection(db, 'sessions', sessionId, 'voice_channels');
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const chans: VoiceChannel[] = [];
                snapshot.forEach(doc => {
                    chans.push({ id: doc.id, ...doc.data() } as VoiceChannel);
                });
                if (chans.length === 0) createChannel('General', 'general');
                else setChannels(chans);
            });
            return () => unsubscribe();
        }, [sessionId]);

        const createChannel = async (name: string, type: 'general' | 'breakout' | 'private') => {
            await setDoc(doc(db, 'sessions', sessionId, 'voice_channels', name.toLowerCase()), {
                name, type, participants: [], maxParticipants: 50
            });
        };

        const joinChannel = async (channelId: string) => {
            if (activeChannel === channelId) return;
            if (activeChannel) await leaveChannel();
            setActiveChannel(channelId);
            const participantData = {
                peerId: userId, name: userName, muted: isMuted, deafened: isDeafened,
                speaking: false, volume: 100, handRaised: false, role: 'participant',
                channelId, online: true, joinedAt: serverTimestamp()
            };
            await setDoc(doc(db, 'sessions', sessionId, 'voice_participants', userId), participantData);
            toast.success(`Joined ${channelId}`);
        };

        const leaveChannel = async () => {
            if (!activeChannel) return;
            myStream?.getTracks().forEach(track => track.stop());
            setMyStream(null);
            peerConnectionsRef.current.forEach((call: any) => call.close());
            peerConnectionsRef.current.clear();
            remoteStreamsRef.current.clear();
            // Remove ALL audio elements
            document.querySelectorAll('audio[id^="audio-"]').forEach(el => el.remove());
            await deleteDoc(doc(db, 'sessions', sessionId, 'voice_participants', userId));
            setActiveChannel(null);
        };

        const updateParticipantStatus = async (data: Partial<VoiceParticipant>) => {
            try { await updateDoc(doc(db, 'sessions', sessionId, 'voice_participants', userId), data); } catch (e) { }
        };

        const handleRemoteStream = (remoteUserId: string, stream: MediaStream) => {
            // Reuse or create audio element
            let audio = document.getElementById(`audio-${remoteUserId}`) as HTMLAudioElement;
            if (!audio) {
                audio = document.createElement('audio');
                audio.id = `audio-${remoteUserId}`;
                document.body.appendChild(audio);
            }

            // Update stream
            audio.srcObject = stream;
            audio.autoplay = true;

            // Force play
            audio.play().catch(e => {
                console.warn("Autoplay prevented", e);
                // Optionally show a "Click to unmute" UI if this fails
            });

            // Output device selection
            // @ts-ignore
            if (audio.setSinkId && settings.outputDeviceId && settings.outputDeviceId !== 'default') {
                // @ts-ignore
                audio.setSinkId(settings.outputDeviceId).catch(e => console.warn("Sink failed", e));
            }
        };

        const toggleMute = () => {
            if (myStream) {
                myStream.getAudioTracks().forEach(track => {
                    track.enabled = !track.enabled;
                });
                setIsMuted(!isMuted);
                updateParticipantStatus({ muted: !isMuted });
            }
        };

        const toggleDeafen = () => {
            setIsDeafened(!isDeafened);
            updateParticipantStatus({ deafened: !isDeafened });

            // Mute all remote audio
            remoteStreamsRef.current.forEach((stream, id) => {
                const audio = document.getElementById(`audio-${id}`) as HTMLAudioElement;
                if (audio) {
                    audio.muted = !isDeafened;
                }
            });
        };

        const toggleHandRaise = () => {
            const newState = !participants.find(p => p.id === userId)?.handRaised;
            updateParticipantStatus({ handRaised: newState });
            if (newState) toast('Hand raised ✋');
        };

        const startRecording = () => {
            if (!audioContextRef.current) return;

            const dest = audioContextRef.current.createMediaStreamDestination();
            // Mix all streams
            // Local
            if (myStream) {
                audioContextRef.current.createMediaStreamSource(myStream).connect(dest);
            }
            // Remote
            remoteStreamsRef.current.forEach(stream => {
                audioContextRef.current!.createMediaStreamSource(stream).connect(dest);
            });

            const recorder = new MediaRecorder(dest.stream);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `recording-${sessionId}-${Date.now()}.webm`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                audioChunksRef.current = [];
            };

            recorder.start();
            setIsRecording(true);
            toast.success('Recording started');
        };

        const stopRecording = () => {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            toast.success('Recording saved');
        };

        return (
            <div className="flex flex-col items-center w-full">
                {/* Mic Control */}
                <div className="mic-control my-6 flex justify-center">
                    <button
                        onClick={toggleMute}
                        className={`w-[70px] h-[70px] rounded-full border-none flex items-center justify-center cursor-pointer transition-all duration-200 text-2xl shadow-[0_8px_24px_rgba(79,70,229,0.3)] hover:scale-105 hover:shadow-[0_12px_32px_rgba(79,70,229,0.4)] ${isMuted
                            ? 'bg-gradient-to-br from-[#ef4444] to-[#dc2626] shadow-[0_8px_24px_rgba(239,68,68,0.3)]'
                            : 'bg-gradient-to-br from-[#4f46e5] to-[#7c3aed]'
                            } text-white`}
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
                    </button>
                </div>

                {/* Record Control */}
                <div className="record-control flex justify-center w-full px-4 mb-6">
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`flex items-center gap-2 px-6 py-3 border-2 rounded-xl font-medium cursor-pointer transition-all w-full justify-center ${isRecording
                            ? 'bg-[#ef4444] text-white border-[#ef4444] animate-pulse'
                            : 'bg-white text-[#ef4444] border-[#ef4444] hover:bg-[#fef2f2]'
                            }`}
                    >
                        {isRecording ? (
                            <>
                                <FaStop /> Stop Recording
                            </>
                        ) : (
                            <>
                                <FaRecordVinyl /> Record Session
                            </>
                        )}
                    </button>
                </div>

                {/* Quick Settings Row */}
                <div className="flex justify-center gap-4 text-gray-400 mb-4">
                    <button onClick={toggleDeafen} className={`p-2 rounded-lg hover:bg-gray-100 ${isDeafened ? 'text-red-500' : 'text-gray-500'}`} title="Deafen">
                        {isDeafened ? <FaHeadphonesAlt size={20} /> : <FaHeadphones size={20} />}
                    </button>
                    <button onClick={toggleHandRaise} className={`p-2 rounded-lg hover:bg-gray-100 ${participants.find(p => p.id === userId)?.handRaised ? 'text-yellow-500' : 'text-gray-500'}`} title="Raise Hand">
                        <FaHandPaper size={20} />
                    </button>
                    <button onClick={() => setShowSettings(true)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Settings">
                        <FaCog size={20} />
                    </button>
                </div>

                {/* Visualizer (Simple) */}
                <div className="flex items-end justify-center gap-1 h-8 mb-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            className={`w-1.5 rounded-full transition-all duration-75 ${!isMuted && audioLevel > i * 15 ? 'bg-[#7c3aed] h-full' : 'bg-gray-200 h-1.5'}`}
                        />
                    ))}
                </div>

                {/* Settings Modal (Preserved) */}
                <AnimatePresence>
                    {showSettings && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
                            style={{ zIndex: 9999 }}
                            onClick={() => setShowSettings(false)}
                        >
                            <div
                                className="bg-gray-800 p-6 rounded-2xl w-full max-w-md shadow-2xl text-white"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-xl font-bold mb-4">Voice Settings</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Input Device</label>
                                        <select
                                            value={settings.inputDeviceId}
                                            onChange={(e) => setSettings({ ...settings, inputDeviceId: e.target.value })}
                                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white"
                                        >
                                            <option value="default">Default</option>
                                            {inputDevices.map(device => (
                                                <option key={device.deviceId} value={device.deviceId}>
                                                    {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Output Device</label>
                                        <select
                                            value={settings.outputDeviceId}
                                            onChange={(e) => setSettings({ ...settings, outputDeviceId: e.target.value })}
                                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white"
                                        >
                                            <option value="default">Default</option>
                                            {outputDevices.map(device => (
                                                <option key={device.deviceId} value={device.deviceId}>
                                                    {device.label || `Speaker ${device.deviceId.slice(0, 5)}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="pt-4 border-t border-gray-700 mt-4 space-y-3">
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.echoCancellation}
                                                onChange={e => setSettings({ ...settings, echoCancellation: e.target.checked })}
                                                className="form-checkbox bg-gray-700 border-gray-600 rounded text-blue-500"
                                            />
                                            <span>Echo Cancellation</span>
                                        </label>
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.noiseSuppression}
                                                onChange={e => setSettings({ ...settings, noiseSuppression: e.target.checked })}
                                                className="form-checkbox bg-gray-700 border-gray-600 rounded text-blue-500"
                                            />
                                            <span>Noise Suppression</span>
                                        </label>
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.autoGainControl}
                                                onChange={e => setSettings({ ...settings, autoGainControl: e.target.checked })}
                                                className="form-checkbox bg-gray-700 border-gray-600 rounded text-blue-500"
                                            />
                                            <span>Automatic Gain Control</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

export default CompleteVoiceSystem;
