import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/base.css'
import './styles/landing.css'
import './styles/auth.css'
import './styles/app.css'

const container = document.getElementById('root')
if (!container) throw new Error('No se encontró el contenedor #root')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
