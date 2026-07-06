import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './client/services/queryClient.js'
import AppRouter from './client/routes/index.js'
import { useThemeStore } from './client/store/themeStore.js'
import './client/styles/global.css'
import './client/styles/profile.css'
import './client/styles/payment.css'
import './client/styles/orders.css'
import './client/styles/seller.css'
import './client/styles/admin.css'
import './client/styles/dashboard.css'

function ThemeSync() {
  const theme = useThemeStore((s) => s.theme)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeSync />
        <AppRouter />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
