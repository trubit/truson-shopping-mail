import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore.js'
import MainLayout from '../layouts/MainLayout.js'
import AuthLayout from '../layouts/AuthLayout.js'
import LoadingSpinner from '../components/ui/LoadingSpinner.js'

const HomePage        = lazy(() => import('../pages/home/HomePage.js'))
const LoginPage       = lazy(() => import('../pages/auth/LoginPage.js'))
const RegisterPage    = lazy(() => import('../pages/auth/RegisterPage.js'))
const ProductsPage    = lazy(() => import('../pages/products/ProductsPage.js'))
const ProductPage     = lazy(() => import('../pages/products/ProductPage.js'))
const CartPage        = lazy(() => import('../pages/cart/CartPage.js'))
const OrdersPage      = lazy(() => import('../pages/orders/OrdersPage.js'))
const ProfilePage     = lazy(() => import('../pages/profile/ProfilePage.js'))
const NotFoundPage    = lazy(() => import('../pages/NotFoundPage.js'))

const SuspenseWrap = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingSpinner fullscreen />}>{children}</Suspense>
)

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>
}

export default function AppRouter() {
  return (
    <SuspenseWrap>
      <Routes>
        {/* Public routes with main layout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />

          {/* Protected routes */}
          <Route path="/orders" element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        </Route>

        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </SuspenseWrap>
  )
}
