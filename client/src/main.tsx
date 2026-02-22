import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerLicense } from '@syncfusion/ej2-base'
import { setCulture, setCurrencyCode } from '@syncfusion/ej2-base'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './styles/main.scss'

// ===== Licență Syncfusion =====
registerLicense(import.meta.env.VITE_SYNCFUSION_LICENSE ?? '')

// ===== Cultură română pentru componentele Syncfusion =====
setCulture('ro')
setCurrencyCode('RON')

// ===== TanStack Query client =====
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// ===== Mount =====
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)

