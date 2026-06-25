import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import ProtectedRoute from './router/protectedRoute'
import NotFound from './router/notFound'
import { useAuthStore, type UserRole } from './features/auth/state/authState'

import QuickKartLogin from './features/auth/pages/login'
import CreateAccountModal from './features/auth/components/createAccountModal'
import CustomerRegistration from './features/auth/pages/customerRegistration'
import StoreRegistration from './features/auth/pages/storeRegistration'
import DeliveryPartnerRegistration from './features/auth/pages/deliveryPartnerRegistration'
import PendingApproval from './features/auth/pages/pendingApproval'

import CustomerHome from './features/customer/pages/customerHome'
import FreshMartStorePage from './features/customer/pages/singleStore'
import ProductDiscoveryPage from './features/customer/pages/productDiscovery'

import QuickKartDashboard from './features/driver/pages/driverDashboard'

import DashboardPage from './features/store/pages/storeDashboardPage'
import AddProductPage from './features/store/pages/addEditProductPage'
import ProductsPage from './features/store/pages/productsPage'
import StoreProfilePage from './features/store/pages/storeProfile'
import StoreSettingsPage from './features/store/pages/storeSettingsPage'

import Dashboard from './features/admin/pages/dashboard'
import StoreApplicationsPage from './features/admin/pages/storeApplications'
import StoreApplicationReview from './features/admin/pages/storeReview'
import DriverApplicationsPage from './features/admin/pages/driverApplications'
import DriverApplicationReview from './features/admin/pages/driverReview'

import QuickKartLanding from './features/marketing/pages/landing'
import QuickKartAbout from './features/marketing/pages/about'
import ProductDetailPage from './features/customer/pages/prductDetailsPage'
import StoresPage from './features/customer/pages/storesPage'
import CartPage from './features/customer/pages/cartPage'

/* -------------------------------------------------------------------------- */
/*  Role → home path (shared between PublicOnlyRoute and NavBar)             */
/* -------------------------------------------------------------------------- */

const ROLE_HOME: Record<UserRole, string> = {
  CUSTOMER: '/customer/home',
  ADMIN: '/admin/dashboard',
  DRIVER: '/driver/dashboard',
  STORE: '/store/dashboard',
}

/* -------------------------------------------------------------------------- */
/*  PublicOnlyRoute                                                           */
/*  Wraps pages that logged-in users should never see (landing, login, etc). */
/*  If the auth store says the user is authenticated, redirect them straight  */
/*  to their role's home — no flash, no back-button loop.                    */
/* -------------------------------------------------------------------------- */

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore()

  if (isAuthenticated && user) {
    const home = ROLE_HOME[user.role] ?? '/login'
    return <Navigate to={home} replace />
  }

  return <>{children}</>
}

/* -------------------------------------------------------------------------- */
/*  App                                                                       */
/* -------------------------------------------------------------------------- */

function App() {
  const hydrate = useAuthStore((state) => state.hydrate)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    hydrate().finally(() => setReady(true))
  }, [hydrate])

  if (!ready) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff8f4',
        }}
      >
        <span style={{ color: '#c9a96e', fontWeight: 600, fontSize: 18 }}>
          QuickKart
        </span>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />

      <Routes>
        {/* ── Public routes ────────────────────────────────────────────── */}
        <Route path="/" element={<Navigate to="/landing" replace />} />

        {/* Landing — logged-in users are sent to their dashboard instead */}
        <Route
          path="/landing"
          element={
            <PublicOnlyRoute>
              <QuickKartLanding />
            </PublicOnlyRoute>
          }
        />

        {/* Login — also guard so logged-in users aren't stuck here */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <QuickKartLogin />
            </PublicOnlyRoute>
          }
        />

        <Route path="/about" element={<QuickKartAbout />} />
        <Route path="/create-account" element={<CreateAccountModal />} />
        <Route path="/register/customer" element={<CustomerRegistration />} />
        <Route path="/register/store" element={<StoreRegistration />} />
        <Route path="/register/delivery" element={<DeliveryPartnerRegistration />} />

        <Route path="/driver/pending" element={<PendingApproval role="driver" />} />
        <Route path="/store/pending" element={<PendingApproval role="store" />} />

        {/* ── Customer routes ──────────────────────────────────────────── */}
        <Route path="/customer/home" element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <CustomerHome />
          </ProtectedRoute>
        } />
        <Route path="/customer/stores" element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <StoresPage />
          </ProtectedRoute>
        } />
        <Route path="/customer/store/:storeId" element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <FreshMartStorePage />
          </ProtectedRoute>
        } />
        <Route path="/customer/discovery" element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <ProductDiscoveryPage />
          </ProtectedRoute>
        } />

        <Route path="/customer/store/:storeId/product/:productId" element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <ProductDetailPage />
          </ProtectedRoute>
        } />

        <Route path="/customer/cart" element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <CartPage />
          </ProtectedRoute>
        } />

        {/* ── Driver routes ────────────────────────────────────────────── */}
        <Route path="/driver/dashboard" element={
          <ProtectedRoute allowedRoles={['DRIVER']}>
            <QuickKartDashboard />
          </ProtectedRoute>
        } />

        {/* ── Store routes ─────────────────────────────────────────────── */}
        <Route path="/store/dashboard" element={
          <ProtectedRoute allowedRoles={['STORE']}>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/store/products/new" element={
          <ProtectedRoute allowedRoles={['STORE']}>
            <AddProductPage />
          </ProtectedRoute>
        } />
        <Route path="/store/products" element={
          <ProtectedRoute allowedRoles={['STORE']}>
            <ProductsPage />
          </ProtectedRoute>
        } />
        <Route path="/store/products/:id/edit" element={
          <ProtectedRoute allowedRoles={['STORE']}>
            <AddProductPage />
          </ProtectedRoute>
        } />
        <Route path="/store/profile" element={
          <ProtectedRoute allowedRoles={['STORE']}>
            <StoreProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/store/settings" element={
          <ProtectedRoute allowedRoles={['STORE']}>
            <StoreSettingsPage />
          </ProtectedRoute>
        } />

        {/* ── Admin routes ─────────────────────────────────────────────── */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/approvals/store" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <StoreApplicationsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/approvals/store/:id" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <StoreApplicationReview />
          </ProtectedRoute>
        } />
        <Route path="/admin/approvals/drivers" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DriverApplicationsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/approvals/driver/:id" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DriverApplicationReview />
          </ProtectedRoute>
        } />

        {/* ── Catch-all ────────────────────────────────────────────────── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App