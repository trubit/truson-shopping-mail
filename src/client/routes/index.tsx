import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore.js'
import MainLayout from '../layouts/MainLayout.js'
import LoadingSpinner from '../components/ui/LoadingSpinner.js'

// Auth pages
const LoginPage          = lazy(() => import('../pages/auth/Login/index.js'))
const RegisterPage       = lazy(() => import('../pages/auth/Register/index.js'))
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPassword/index.js'))
const ResetPasswordPage  = lazy(() => import('../pages/auth/ResetPassword/index.js'))
const VerifyEmailPage    = lazy(() => import('../pages/auth/VerifyEmail/index.js'))

// App pages
const HomePage        = lazy(() => import('../pages/home/HomePage.js'))
const ProductsPage    = lazy(() => import('../pages/products/ProductsPage.js'))
const ProductPage     = lazy(() => import('../pages/products/ProductPage.js'))
const SearchResults   = lazy(() => import('../pages/products/SearchResults.js'))
const CategoryPage    = lazy(() => import('../pages/products/CategoryPage.js'))
const CartPage        = lazy(() => import('../pages/cart/CartPage.js'))
const CheckoutPage    = lazy(() => import('../pages/checkout/CheckoutPage.js'))
const OrdersPage      = lazy(() => import('../pages/orders/OrdersPage.js'))
const NotFoundPage    = lazy(() => import('../pages/NotFoundPage.js'))

// Payment pages
const PaymentPage     = lazy(() => import('../pages/payment/PaymentPage/index.js'))
const PaymentComplete = lazy(() => import('../pages/payment/PaymentComplete/index.js'))
const PaymentSuccess  = lazy(() => import('../pages/payment/PaymentSuccess/index.js'))
const PaymentFailed   = lazy(() => import('../pages/payment/PaymentFailed/index.js'))

// Profile pages (nested layout)
const ProfileLayout = lazy(() => import('../pages/profile/ProfileLayout/index.js'))
const ProfilePage   = lazy(() => import('../pages/profile/Profile/index.js'))
const EditProfile   = lazy(() => import('../pages/profile/EditProfile/index.js'))
const AddressBook   = lazy(() => import('../pages/profile/AddressBook/index.js'))
const SettingsPage  = lazy(() => import('../pages/profile/Settings/index.js'))

// Order detail pages
const OrderDetails = lazy(() => import('../pages/orders/OrderDetails/index.js'))
const TrackOrder   = lazy(() => import('../pages/orders/TrackOrder/index.js'))
const ReturnOrder  = lazy(() => import('../pages/orders/ReturnOrder/index.js'))

// Seller pages
const SellerProducts      = lazy(() => import('../pages/seller/SellerProducts.js'))
const SellerProductCreate = lazy(() => import('../pages/seller/SellerProductCreate.js'))
const SellerProductEdit   = lazy(() => import('../pages/seller/SellerProductEdit.js'))
const SellerOrders        = lazy(() => import('../pages/seller/SellerOrders/index.js'))

// Admin pages
const AdminLayout    = lazy(() => import('../pages/admin/AdminLayout/index.js'))
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard/index.js'))
const AdminUsers     = lazy(() => import('../pages/admin/AdminUsers/index.js'))
const AdminProducts  = lazy(() => import('../pages/admin/AdminProducts/index.js'))
const AdminOrders    = lazy(() => import('../pages/admin/AdminOrders/index.js'))

const SuspenseWrap = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingSpinner fullscreen />}>{children}</Suspense>
)

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

const SellerRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'seller' && user?.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>
}

export default function AppRouter() {
  return (
    <SuspenseWrap>
      <Routes>
        {/* Main layout */}
        <Route element={<MainLayout />}>
          <Route path="/"                     element={<HomePage />} />
          <Route path="/products"             element={<ProductsPage />} />
          <Route path="/products/:id"         element={<ProductPage />} />
          <Route path="/search"               element={<SearchResults />} />
          <Route path="/category/:category"   element={<CategoryPage />} />
          <Route path="/cart"                 element={<CartPage />} />
          <Route path="/checkout"              element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
          <Route path="/orders"                element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
          <Route path="/orders/:id"            element={<PrivateRoute><OrderDetails /></PrivateRoute>} />
          <Route path="/orders/:id/track"      element={<PrivateRoute><TrackOrder /></PrivateRoute>} />
          <Route path="/orders/:id/return"     element={<PrivateRoute><ReturnOrder /></PrivateRoute>} />

          {/* Payment — PrivateRoute except /payment/complete which handles Stripe redirect */}
          <Route path="/payment/:orderId"   element={<PrivateRoute><PaymentPage /></PrivateRoute>} />
          <Route path="/payment/complete"   element={<PaymentComplete />} />
          <Route path="/payment/success"    element={<PrivateRoute><PaymentSuccess /></PrivateRoute>} />
          <Route path="/payment/failed"     element={<PrivateRoute><PaymentFailed /></PrivateRoute>} />

          {/* Seller dashboard */}
          <Route path="/seller/products"             element={<SellerRoute><SellerProducts /></SellerRoute>} />
          <Route path="/seller/products/create"      element={<SellerRoute><SellerProductCreate /></SellerRoute>} />
          <Route path="/seller/products/edit/:id"    element={<SellerRoute><SellerProductEdit /></SellerRoute>} />
          <Route path="/seller/orders"               element={<SellerRoute><SellerOrders /></SellerRoute>} />


          {/* Admin dashboard */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index              element={<AdminDashboard />} />
            <Route path="users"       element={<AdminUsers />} />
            <Route path="products"    element={<AdminProducts />} />
            <Route path="orders"      element={<AdminOrders />} />
          </Route>

          {/* Profile — nested layout with sidebar, inside MainLayout for navbar */}
          <Route path="/profile" element={<PrivateRoute><ProfileLayout /></PrivateRoute>}>
            <Route index           element={<ProfilePage />} />
            <Route path="edit"     element={<EditProfile />} />
            <Route path="address"  element={<AddressBook />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Auth — full screen */}
        <Route path="/login"           element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register"        element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />
        <Route path="/verify-email"    element={<VerifyEmailPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </SuspenseWrap>
  )
}
