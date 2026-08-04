import { useEffect, useState, lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import ProtectedRoute from './router/protectedRoute'
import NotFound from './router/notFound'
import { connectSocket, disconnectSocket } from "./lib/socket";
import { useAuthStore, type UserRole } from './features/auth/state/authState'
import SplashScreen from './components/splashScreen'

// Lazy loaded routes
const QuickKartLogin = lazy(() => import('./features/auth/pages/login'))
const CreateAccountModal = lazy(() => import('./features/auth/components/createAccountModal'))
const CustomerRegistration = lazy(() => import('./features/auth/pages/customerRegistration'))
const StoreRegistration = lazy(() => import('./features/auth/pages/storeRegistration'))
const DeliveryPartnerRegistration = lazy(() => import('./features/auth/pages/deliveryPartnerRegistration'))
const PendingApproval = lazy(() => import('./features/auth/pages/pendingApproval'))

const CustomerHome = lazy(() => import('./features/customer/pages/customerHome'))
const FreshMartStorePage = lazy(() => import('./features/customer/pages/singleStore'))
const ProductDiscoveryPage = lazy(() => import('./features/customer/pages/productDiscovery'))
const ProductDetailPage = lazy(() => import('./features/customer/pages/prductDetailsPage'))
const StoresPage = lazy(() => import('./features/customer/pages/storesPage'))
const CartPage = lazy(() => import('./features/customer/pages/cartPage'))
const CheckoutPage = lazy(() => import('./features/customer/pages/checkoutPage'))
const MyOrdersPage = lazy(() => import('./features/customer/pages/myOrdersPage'))
const OrderTrackingPage = lazy(() => import('./features/customer/pages/orderTrackingPage'))
const CustomerProfilePage = lazy(() => import('./features/customer/pages/customerProfile'))
const WalletPage = lazy(() => import('./features/customer/pages/walletPage'))
const CustomerShell = lazy(() => import('./features/customer/pages/customerShell'))

const DriverShell = lazy(() => import('./features/driver/pages/driverShell'))
const QuickKartDashboard = lazy(() => import('./features/driver/pages/driverDashboard'))
const DriverDeliveriesPage = lazy(() => import('./features/driver/pages/driverDeliveryPage'))
const DriverEarningsPage = lazy(() => import('./features/driver/pages/driverEarningsPage'))
const DriverWalletPage = lazy(() => import('./features/driver/pages/driverWalletPage'))
const DriverRewardsPage = lazy(() => import('./features/driver/pages/driverRewardsPage'))

const DashboardPage = lazy(() => import('./features/store/pages/storeDashboardPage'))
const AddProductPage = lazy(() => import('./features/store/pages/addEditProductPage'))
const ProductsPage = lazy(() => import('./features/store/pages/productsPage'))
const StoreProfilePage = lazy(() => import('./features/store/pages/storeProfile'))
const StoreSettingsPage = lazy(() => import('./features/store/pages/storeSettingsPage'))
const OrdersPage = lazy(() => import('./features/store/pages/ordersList'))
const OrderDetailPage = lazy(() => import('./features/store/pages/orderDetail'))
const PackingChecklistPage = lazy(() => import('./features/store/pages/packingCheckList'))
const PackingCompletePage = lazy(() => import('./features/store/pages/packingComplete'))
const StoreShell = lazy(() => import('./features/store/pages/storeShell').then(m => ({ default: m.StoreShell })))

const Dashboard = lazy(() => import('./features/admin/pages/dashboard'))
const StoreApplicationsPage = lazy(() => import('./features/admin/pages/storeApplications'))
const StoreApplicationReview = lazy(() => import('./features/admin/pages/storeReview'))
const DriverApplicationsPage = lazy(() => import('./features/admin/pages/driverApplications'))
const DriverApplicationReview = lazy(() => import('./features/admin/pages/driverReview'))

const QuickKartLanding = lazy(() => import('./features/marketing/pages/landing'))
const QuickKartAbout = lazy(() => import('./features/marketing/pages/about'))

const ROLE_HOME: Record<UserRole, string> = {
  CUSTOMER: '/customer/home',
  ADMIN: '/admin/dashboard',
  DRIVER: '/driver/dashboard',
  STORE: '/store/dashboard',
}

const PageLoader = () => (
  <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8F5' }}>
    <span style={{ color: '#145C43', fontWeight: 600, fontSize: 18 }}>QuickKart...</span>
  </div>
)

// keeps a logged-in user off the public login/landing pages, bouncing them to their home instead
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore()
  if (isAuthenticated && user) {
    if ((user.role === 'DRIVER' || user.role === 'STORE') && user.status && user.status !== 'ACTIVE') {
      const pendingPath = user.role === 'DRIVER' ? '/driver/pending' : '/store/pending'
      return <Navigate to={pendingPath} replace />
    }
    const home = ROLE_HOME[user.role] ?? '/login'
    return <Navigate to={home} replace />
  }
  return <>{children}</>
}

function App() {
  const hydrate = useAuthStore((state) => state.hydrate)
  const [ready, setReady] = useState(false)
  const [isSplashing, setIsSplashing] = useState(true)

  // checks the session once on load before rendering any routes
  useEffect(() => {
    hydrate().finally(() => setReady(true))
  }, [hydrate])

  // ensures splash screen animation completes sequence before fading out
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashing(false);
    }, 1400);
    return () => clearTimeout(timer);
  }, []);

  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      connectSocket();
    } else {
      disconnectSocket();
    }
  }, [user]);

  return (
    <>
      <SplashScreen isLoading={!ready || isSplashing} />
      <BrowserRouter>
        <Toaster position="top-right" richColors closeButton expand gap={10} visibleToasts={4} />
        <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* public auth & registration routes (redirect logged-in users to their role home) */}
          <Route path="/" element={<PublicOnlyRoute><QuickKartLanding /></PublicOnlyRoute>} />
          <Route path="/landing" element={<Navigate to="/" replace />} />
          <Route path="/login" element={<PublicOnlyRoute><QuickKartLogin /></PublicOnlyRoute>} />
          <Route path="/about" element={<QuickKartAbout />} />
          <Route path="/create-account" element={<PublicOnlyRoute><CreateAccountModal standalone={true} /></PublicOnlyRoute>} />
          <Route path="/register/customer" element={<PublicOnlyRoute><CustomerRegistration /></PublicOnlyRoute>} />
          <Route path="/register/store" element={<PublicOnlyRoute><StoreRegistration /></PublicOnlyRoute>} />
          <Route path="/register/delivery" element={<PublicOnlyRoute><DeliveryPartnerRegistration /></PublicOnlyRoute>} />
          <Route path="/driver/pending" element={<PendingApproval role="driver" />} />
          <Route path="/store/pending" element={<PendingApproval role="store" />} />

          {/* customer routes — most wrapped in CustomerShell */}
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
            <Route path="discovery" element={<ProductDiscoveryPage />} />
          </Route>

          {/* these stay outside the shell — they manage their own header */}
          <Route path="/customer/checkout" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><CheckoutPage /></ProtectedRoute>} />
          <Route path="/customer/track/:orderId" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><OrderTrackingPage /></ProtectedRoute>} />

          {/* driver routes — all wrapped in DriverShell */}
          <Route
            path="/driver"
            element={<ProtectedRoute allowedRoles={['DRIVER']}><DriverShell /></ProtectedRoute>}
          >
            <Route path="dashboard" element={<QuickKartDashboard />} />
            <Route path="deliveries" element={<DriverDeliveriesPage />} />
            <Route path="earnings" element={<DriverEarningsPage />} />
            <Route path="wallet" element={<DriverWalletPage />} />
            <Route path="rewards" element={<DriverRewardsPage />} />
          </Route>

          {/* store routes — all wrapped in StoreShell */}
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

          {/* admin routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/approvals/store" element={<ProtectedRoute allowedRoles={['ADMIN']}><StoreApplicationsPage /></ProtectedRoute>} />
          <Route path="/admin/approvals/store/:id" element={<ProtectedRoute allowedRoles={['ADMIN']}><StoreApplicationReview /></ProtectedRoute>} />
          <Route path="/admin/approvals/drivers" element={<ProtectedRoute allowedRoles={['ADMIN']}><DriverApplicationsPage /></ProtectedRoute>} />
          <Route path="/admin/approvals/driver/:id" element={<ProtectedRoute allowedRoles={['ADMIN']}><DriverApplicationReview /></ProtectedRoute>} />

          {/* catch-all */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </Suspense>
    </BrowserRouter>
    </>
  )
}

export default App