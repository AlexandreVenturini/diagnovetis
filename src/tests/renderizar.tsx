import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClientProvider } from '@tanstack/react-query'
import { criarClienteConsultas } from '../features/shared/consultas'

export function renderizar(elemento: ReactElement) {
  return renderToStaticMarkup(<QueryClientProvider client={criarClienteConsultas()}>{elemento}</QueryClientProvider>)
}
