import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppRoutes from './routes/AppRoutes.jsx'
import { AuthProvider } from "./context/AuthProvider.jsx";


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
<AppRoutes/>
    </AuthProvider>
    
  </StrictMode>,
)
