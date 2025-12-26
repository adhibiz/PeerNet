const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const http = require('http');
const server = http.createServer(app);
const initSocket = require('./socket');

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Socket.io
initSocket(server);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/connections', require('./routes/connections'));
app.use('/api/users', require('./routes/users'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
