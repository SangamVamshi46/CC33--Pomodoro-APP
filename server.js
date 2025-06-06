const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// Enable CORS for all routes
app.use(cors());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Main route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Set port
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on:`);
    console.log(`- Local: http://localhost:${PORT}`);
    console.log(`- Network: http://192.168.1.251:${PORT}`);
    console.log(`- Mobile: Use your computer's IP address with port ${PORT}`);
}); 