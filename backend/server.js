const app = require('./src/app');
const connectDB = require('./src/config/db/db');
require('dotenv').config();
const dns = require('dns')

dns.setServers(['1.1.1.1' , '8.8.8.8'])



const startServer = async () => {
    try {
        await connectDB();
        console.log("✅ MongoDB Connected Successfully");
    } catch (err) {
        console.error("❌ DB Connection Failed:", err.message);
        // Don't crash the server - Vercel needs it to respond
        process.exitCode = 1;
    }
};

// Connect to database on startup
startServer();

// Export for Vercel serverless
module.exports = app;

// Local development server
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}