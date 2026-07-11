import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import ProtectedRoute from './router/protectedRoute'
import NotFound from './router/notFound'
import { connectSocket, disconnectSocket } from "./lib/socket";
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

import DriverShell from './features/driver/pages/driverShell'
import QuickKartDashboard from './features/driver/pages/driverDashboard'
import DriverDeliveriesPage from './features/driver/pages/driverDeliveryPage'

import DashboardPage from './features/store/pages/storeDashboardPage'
import AddProductPage from './features/store/pages/addEditProductPage'
import ProductsPage from './features/store/pages/productsPage'
import StoreProfilePage from './features/store/pages/storeProfile'
import StoreSettingsPage from './features/store/pages/storeSettingsPage'
import { StoreShell } from './features/store/pages/storeShell'

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
import CheckoutPage from './features/customer/pages/checkoutPage'
import MyOrdersPage from './features/customer/pages/myOrdersPage'
import OrderTrackingPage from './features/customer/pages/orderTrackingPage'
import CustomerProfilePage from './features/customer/pages/customerProfile'
import WalletPage from './features/customer/pages/walletPage'
import OrdersPage from './features/store/pages/ordersList'
import OrderDetailPage from './features/store/pages/orderDetail'
import PackingChecklistPage from './features/store/pages/packingCheckList'
import PackingCompletePage from './features/store/pages/packingComplete'
import CustomerShell from './features/customer/pages/customerShell'

const ROLE_HOME: Record<UserRole, string> = {
  CUSTOMER: '/customer/home',
  ADMIN: '/admin/dashboard',
  DRIVER: '/driver/dashboard',
  STORE: '/store/dashboard',
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore()
  if (isAuthenticated && user) {
    const home = ROLE_HOME[user.role] ?? '/login'
    return <Navigate to={home} replace />
  }
  return <>{children}</>
}

function App() {
  const hydrate = useAuthStore((state) => state.hydrate)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    hydrate().finally(() => setReady(true))
  }, [hydrate])

  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      connectSocket();
    } else {
      disconnectSocket();
    }
  }, [user]);

  if (!ready) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff8f4' }}>
        <span style={{ color: '#c9a96e', fontWeight: 600, fontSize: 18 }}>QuickKart</span>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <Routes>

        {/* ── Public routes ─────────────────────────────────────────── */}
        <Route path="/" element={<Navigate to="/landing" replace />} />
        <Route path="/landing" element={<PublicOnlyRoute><QuickKartLanding /></PublicOnlyRoute>} />
        <Route path="/login" element={<PublicOnlyRoute><QuickKartLogin /></PublicOnlyRoute>} />
        <Route path="/about" element={<QuickKartAbout />} />
        <Route path="/create-account" element={<CreateAccountModal />} />
        <Route path="/register/customer" element={<CustomerRegistration />} />
        <Route path="/register/store" element={<StoreRegistration />} />
        <Route path="/register/delivery" element={<DeliveryPartnerRegistration />} />
        <Route path="/driver/pending" element={<PendingApproval role="driver" />} />
        <Route path="/store/pending" element={<PendingApproval role="store" />} />

        {/* ── Customer routes ───────────────────────────────────────── */}
        {/* ── Customer routes (most wrapped in CustomerShell) ──────── */}
        <Route
          path="/customer"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <CustomerShell />
            </ProtectedRoute>
          }
        >
          <Route path="home" element={<CustomerHome />} />
          <Route path="stores" element={<StoresPage />} />
          <Route path="store/:storeId" element={<FreshMartStorePage />} />
          <Route path="store/:storeId/product/:productId" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="orders" element={<MyOrdersPage />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="profile" element={<CustomerProfilePage />} />
        </Route>

        {/* These two stay outside the shell — they manage their own header */}
        <Route path="/customer/discovery" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><ProductDiscoveryPage /></ProtectedRoute>} />
        <Route path="/customer/checkout" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><CheckoutPage /></ProtectedRoute>} />
        <Route path="/customer/track/:orderId" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><OrderTrackingPage /></ProtectedRoute>} />

        {/* ── Driver routes (all wrapped in DriverShell) ────────────── */}
        <Route
          path="/driver"
          element={<ProtectedRoute allowedRoles={['DRIVER']}><DriverShell /></ProtectedRoute>}
        >
          <Route path="dashboard" element={<QuickKartDashboard />} />
          <Route path="deliveries" element={<DriverDeliveriesPage />} />
        </Route>

        {/* ── Store routes (all wrapped in StoreShell) ──────────────── */}
        <Route path="/store/dashboard" element={<ProtectedRoute allowedRoles={['STORE']}><StoreShell><DashboardPage /></StoreShell></ProtectedRoute>} />
        <Route path="/store/products/new" element={<ProtectedRoute allowedRoles={['STORE']}><StoreShell><AddProductPage /></StoreShell></ProtectedRoute>} />
        <Route path="/store/products" element={<ProtectedRoute allowedRoles={['STORE']}><StoreShell><ProductsPage /></StoreShell></ProtectedRoute>} />
        <Route path="/store/products/:id/edit" element={<ProtectedRoute allowedRoles={['STORE']}><StoreShell><AddProductPage /></StoreShell></ProtectedRoute>} />
        <Route path="/store/profile" element={<ProtectedRoute allowedRoles={['STORE']}><StoreShell><StoreProfilePage /></StoreShell></ProtectedRoute>} />
        <Route path="/store/settings" element={<ProtectedRoute allowedRoles={['STORE']}><StoreShell><StoreSettingsPage /></StoreShell></ProtectedRoute>} />
        <Route path="/store/orders" element={<ProtectedRoute allowedRoles={['STORE']}><StoreShell><OrdersPage /></StoreShell></ProtectedRoute>} />
        <Route path="/store/orders/:id" element={<ProtectedRoute allowedRoles={['STORE']}><StoreShell><OrderDetailPage /></StoreShell></ProtectedRoute>} />
        <Route path="/store/orders/:id/packing" element={<ProtectedRoute allowedRoles={['STORE']}><StoreShell><PackingChecklistPage /></StoreShell></ProtectedRoute>} />
        <Route path="/store/orders/:id/complete" element={<ProtectedRoute allowedRoles={['STORE']}><StoreShell><PackingCompletePage /></StoreShell></ProtectedRoute>} />

        {/* ── Admin routes ──────────────────────────────────────────── */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/approvals/store" element={<ProtectedRoute allowedRoles={['ADMIN']}><StoreApplicationsPage /></ProtectedRoute>} />
        <Route path="/admin/approvals/store/:id" element={<ProtectedRoute allowedRoles={['ADMIN']}><StoreApplicationReview /></ProtectedRoute>} />
        <Route path="/admin/approvals/drivers" element={<ProtectedRoute allowedRoles={['ADMIN']}><DriverApplicationsPage /></ProtectedRoute>} />
        <Route path="/admin/approvals/driver/:id" element={<ProtectedRoute allowedRoles={['ADMIN']}><DriverApplicationReview /></ProtectedRoute>} />

        {/* ── Catch-all ─────────────────────────────────────────────── */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App