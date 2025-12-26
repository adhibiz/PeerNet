const socketIo = require('socket.io');

const users = {}; // Map socket.id -> userId
const socketToRoom = {}; // Map socket.id -> roomId

module.exports = (server) => {
    const io = socketIo(server, {
        cors: {
            origin: "*", // Allow all origins for now (adjust for production)
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        socket.on('join-room', (roomId, userId) => {
            if (!roomId || !userId) return;

            socket.join(roomId);
            users[socket.id] = userId;
            socketToRoom[socket.id] = roomId;

            console.log(`User ${userId} joined room ${roomId}`);

            // Get all other users in the room
            const usersInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || [])
                .filter(id => id !== socket.id)
                .map(id => ({ socketId: id, userId: users[id] }));

            // Send list of existing users to the new user so they can initiate connections?
            // Actually, simpler mesh pattern:
            // 1. New user joins.
            // 2. We tell existing users "Hey, new user here, please call them".
            //    OR we tell new user "Hey, here are existing users, call them".

            // Pattern: New User = Initiator (easiest for "I just arrived, let me call everyone").
            // Let's send the list of existing users to the new user.
            socket.emit('all-users', usersInRoom);
        });

        socket.on('sending-signal', (payload) => {
            // payload: { userToSignal (socketId), signal, callerID (socketId) }
            io.to(payload.userToSignal).emit('user-joined', {
                signal: payload.signal,
                callerID: payload.callerID,
                callerUserId: users[payload.callerID]
            });
        });

        socket.on('returning-signal', (payload) => {
            // payload: { signal, callerID }
            io.to(payload.callerID).emit('receiving-returned-signal', {
                signal: payload.signal,
                id: socket.id
            });
        });

        socket.on('disconnect', () => {
            const roomId = socketToRoom[socket.id];
            const userId = users[socket.id];

            if (roomId) {
                // Notify others in room
                socket.to(roomId).emit('user-left', socket.id);
            }

            delete users[socket.id];
            delete socketToRoom[socket.id];
            console.log('Client disconnected:', socket.id);
        });
    });
};
