import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Check if we are not already on login page to avoid loops
            if (!window.location.pathname.includes('login')) {
                // Clear token and redirect
                // localStorage.removeItem('token');
                // window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const authService = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data) => api.put('/auth/profile', data)
};

export const roomService = {
    getAll: (filters) => api.get('/rooms', { params: filters }),
    getById: (id) => api.get(`/rooms/${id}`),
    create: (data) => api.post('/rooms', data),
    join: (id) => api.post(`/rooms/${id}/join`),
    leave: (id) => api.post(`/rooms/${id}/leave`),
    delete: (id) => api.delete(`/rooms/${id}`),
    muteParticipant: (roomId, initialParticipantId, isMuted) => api.patch(`/rooms/${roomId}/participants/${initialParticipantId}/mute`, { muted: isMuted }),
    getMySessions: () => api.get('/rooms/my')
};

export const userService = {
    getAll: (filters) => api.get('/users', { params: filters }),
    getById: (id) => api.get(`/users/${id}`),
    follow: (id) => api.post(`/connections/follow/${id}`),
    unfollow: (id) => api.delete(`/connections/unfollow/${id}`),
    getFollowers: () => api.get('/connections/followers'),
    getFollowing: () => api.get('/connections/following')
};

export const skillService = {
    getAll: (params) => api.get('/skills', { params }),
    addUserSkill: (data) => api.post('/skills/user', data),
    removeUserSkill: (id) => api.delete(`/skills/user/${id}`)
};

export const messageService = {
    getMessages: (roomId, params) => api.get(`/messages/room/${roomId}`, { params }),
    sendMessage: (roomId, content) => api.post(`/messages/room/${roomId}`, { content })
};

export default api;
