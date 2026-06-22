import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import ProtectedRoute from './router/protectedRoute'
import { useAuthStore } from './features/auth/state/authState'

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

import Dashboard from './features/admin/pages/dashboard'
import StoreApplicationsPage from './features/admin/pages/storeApplications'
import StoreApplicationReview from './features/admin/pages/storeReview'
import DriverApplicationsPage from './features/admin/pages/driverApplications'
import DriverApplicationReview from './features/admin/pages/driverReview'

import QuickKartLanding from './features/landing'

function App() {
  const hydrate = useAuthStore((state) => state.hydrate)
  const [ready, setReady] = useState(false)

  // On every hard refresh, silently verify the cookie is still valid
  // and re-populate the store. Takes one network round-trip (~100–200ms).
  useEffect(() => {
    hydrate().finally(() => setReady(true))
  }, [hydrate])

  // Blank screen while the cookie check resolves — prevents a flash
  // where a logged-in user briefly sees the login page before the
  // store is populated.
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
      {/* Sonner toaster — sits outside Routes so it works on every page */}
      <Toaster position="top-right" richColors closeButton />

      <Routes>
        {/* ── Public routes (no auth needed) ──────────────────────────── */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<QuickKartLogin />} />
        <Route path="/landing" element={<QuickKartLanding />} />
        <Route path="/create-account" element={<CreateAccountModal />} />
        <Route path="/register/customer" element={<CustomerRegistration />} />
        <Route path="/register/store" element={<StoreRegistration />} />
        <Route path="/register/delivery" element={<DeliveryPartnerRegistration />} />

        {/* Pending approval — cookie present but user not fully logged in */}
        <Route path="/driver/pending" element={<PendingApproval role="driver" />} />
        <Route path="/store/pending" element={<PendingApproval role="store" />} />

        {/* ── Customer routes ──────────────────────────────────────────── */}
        <Route path="/customer/home" element={
          <ProtectedRoute allowedRoles={["CUSTOMER"]}>
            <CustomerHome />
          </ProtectedRoute>
        } />
        <Route path="/customer/store/:storeId" element={
          <ProtectedRoute allowedRoles={["CUSTOMER"]}>
            <FreshMartStorePage />
          </ProtectedRoute>
        } />
        <Route path="/customer/discovery" element={
          <ProtectedRoute allowedRoles={["CUSTOMER"]}>
            <ProductDiscoveryPage />
          </ProtectedRoute>
        } />

        {/* ── Driver routes ────────────────────────────────────────────── */}
        <Route path="/driver/dashboard" element={
          <ProtectedRoute allowedRoles={["DRIVER"]}>
            <QuickKartDashboard />
          </ProtectedRoute>
        } />

        {/* ── Store routes ─────────────────────────────────────────────── */}
        <Route path="/store/dashboard" element={
          <ProtectedRoute allowedRoles={["STORE"]}>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/store/products/new" element={
          <ProtectedRoute allowedRoles={["STORE"]}>
            <AddProductPage />
          </ProtectedRoute>
        } />
        <Route path="/store/products" element={
          <ProtectedRoute allowedRoles={["STORE"]}>
            <ProductsPage />
          </ProtectedRoute>
        } />
        <Route path="/store/products/:id/edit" element={
          <ProtectedRoute allowedRoles={["STORE"]}>
            <AddProductPage />
          </ProtectedRoute>
        } />
        <Route path="/store/profile" element={
          <ProtectedRoute allowedRoles={["STORE"]}>
            <StoreProfilePage />
          </ProtectedRoute>
        } />

        {/* ── Admin routes ─────────────────────────────────────────────── */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/approvals/store" element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <StoreApplicationsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/approvals/store/:id" element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <StoreApplicationReview />
          </ProtectedRoute>
        } />
        <Route path="/admin/approvals/drivers" element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <DriverApplicationsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/approvals/driver/:id" element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <DriverApplicationReview />
          </ProtectedRoute>
        } />

        {/* ── Catch-all ────────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App