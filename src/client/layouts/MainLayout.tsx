import { Outlet } from 'react-router-dom'
import Navbar from '../components/layout/Navbar.js'
import Footer from '../components/layout/Footer.js'
import EmailVerificationBanner from '../components/layout/EmailVerificationBanner/index.js'
import { useMe } from '../hooks/useAuth.js'

function AuthSync() {
  useMe()
  return null
}

export default function MainLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AuthSync />
      <Navbar />
      <EmailVerificationBanner />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
