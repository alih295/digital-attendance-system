const app = require('./src/app');
const connectDB = require('./src/config/db/db');
require('dotenv').config();

const startServer = async () => {
    try {
        await connectDB();
        console.log("MongoDB Connected...");
    } catch (err) {
        console.error("DB Connection Failed:", err);
    }
};

// Initial connection call
startServer();

// Yeh line Vercel ke liye sabse zaroori hai
module.exports = app;

// Local development ke liye
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}