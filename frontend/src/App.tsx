import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import QuickKartLogin from './auth/login'
import CreateAccountModal from './auth/createAccountModal'
import CustomerRegistration from './auth/customerRegistration'
import StoreRegistration from './auth/storeRegistration'
import DeliveryPartnerRegistration from './auth/deliveryPartnerRegistration'
import CustomerHome from './pages/customer/customerHome'
import FreshMartStorePage from './pages/customer/singleStore'
import PendingApproval from './auth/pendingApproval'
import QuickKartDashboard from './pages/Driver/dashboard'
import ProductDiscoveryPage from './pages/customer/productDiscovery'
import Dashboard from './pages/admin/dashboard'
import StoreApplicationsPage from './pages/admin/approvals/store/applications'
import StoreApplicationReview from './pages/admin/approvals/store/review'
import DriverApplicationsPage from './pages/admin/approvals/driver/applications'
import DriverApplicationReview from './pages/admin/approvals/driver/review'
import DashboardPage from './pages/store/DashboardPage'
import QuickKartLanding from './pages/landing'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<QuickKartLogin />} />
        <Route path="/landing" element={<QuickKartLanding />} />

        <Route path="/create-account" element={<CreateAccountModal />} />

        <Route path="/register/customer" element={<CustomerRegistration />} />
        <Route path="/register/store" element={<StoreRegistration />} />
        <Route path="/register/delivery" element={<DeliveryPartnerRegistration />} />
        <Route path="/driver/pending" element={<PendingApproval role="driver" />} />
        <Route path="/store/pending" element={<PendingApproval role="store" />} />


{/* *******************CUSTOMER*************************CUSTOMER*********************CUSTOMER******************************* */}

        <Route path="/home" element={<CustomerHome />} />
        <Route path='/store' element={<FreshMartStorePage />} />
        <Route path='/discovery' element={<ProductDiscoveryPage />} />


{/* *******************DRIVER*************************DRIVER*********************DRIVER******************************* */}

        <Route path='/driver/dashboard' element={<QuickKartDashboard />} />

        <Route path='/store/dashboard' element={<DashboardPage />} />


{/* *******************ADMIN*************************ADMIN*********************ADMIN******************************* */}

        <Route path='/admin/dashboard' element={<Dashboard />} />
        <Route path='/admin/approvals/store' element={<StoreApplicationsPage />} />
        <Route path='/admin/approvals/store/:id' element={<StoreApplicationReview />} />
        <Route path="/admin/approvals/drivers" element={<DriverApplicationsPage />} />
        <Route path="/admin/approvals/driver/:id" element={<DriverApplicationReview />} />


      </Routes>
    </BrowserRouter>
  )
}

export default App