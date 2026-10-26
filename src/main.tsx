import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import './styles/index.css'
import App from './App.tsx'
import { clienteConsultas } from './features/shared/consultas'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={clienteConsultas}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
