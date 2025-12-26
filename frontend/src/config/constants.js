export const PEER_CONFIG = {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true,
    config: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
        ]
    }
};

export const AI_CONFIG = {
    // If using direct API (unsafe for prod, ok for hackathon demo with restrictions)
    // apiKey: process.env.REACT_APP_OPENAI_API_KEY, 
    // Better: use Cloud Function URL
    endpoint: 'https://us-central1-peernet-biz.cloudfunctions.net/chatWithAI'
};

export const SESSION_DEFAULTS = {
    maxParticipants: 4,
    difficulty: 'beginner',
    duration: 60
};
