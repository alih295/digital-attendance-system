const app = require('./src/app');
const connecttoDb = require('./src/config/db/db');
const env = require('dotenv');

env.config();

// DNS setting local debugging ke liye theek hai, 
// lekin Vercel par iski zaroorat nahi hoti.
const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

// Connect to Database
connecttoDb();

// Local testing ke liye ye rehne dein
if (process.env.NODE_ENV !== 'production') {
    app.listen(3000, '0.0.0.0', () => {
        console.log('Server is running locally on port 3000');
    });
}

// Vercel ke liye ye sabse important line hai
module.exports = app;