import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import 'semantic-ui-css/semantic.min.css';
import App from './App.jsx'

const queryClient = new QueryClient();

// createRoot(document.getElementById("ingestRoot")!).render(
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
