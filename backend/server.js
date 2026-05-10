const app = require('./src/app');
const connecttoDb = require('./src/config/db/db');
require('dotenv').config();

// Database connection
connecttoDb();



module.exports = app;
// Port handle karna Vercel ke liye zaroori nahi hota lekin local ke liye theek hai
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// SABSE ZAROORI LINE
