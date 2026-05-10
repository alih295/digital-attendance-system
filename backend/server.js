const app  = require('./src/app')
const connecttoDb = require('./src/config/db/db')
const env = require('dotenv')
env.config()
const dns = require('dns')
dns.setServers(['1.1.1.1' , '8.8.8.8'])
connecttoDb()

app.listen(3000, '0.0.0.0', ()=>{
    console.log('server is running on port 3000')
})