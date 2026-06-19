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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<QuickKartLogin />} />

        <Route path="/create-account" element={<CreateAccountModal />} />

        <Route path="/register/customer" element={<CustomerRegistration />} />
        <Route path="/register/store" element={<StoreRegistration />} />
        <Route path="/register/delivery" element={<DeliveryPartnerRegistration />} />
        <Route path="/driver/pending" element={<PendingApproval role="driver" />} />
        <Route path="/store/pending" element={<PendingApproval role="store" />} />

        <Route path="/home" element={<CustomerHome />} />
        <Route path='/store' element={<FreshMartStorePage />} />
        <Route path='/discovery' element={<ProductDiscoveryPage />} />



        <Route path='/driver/dashboard' element={<QuickKartDashboard />} />

        
        <Route path='/admin/dashboard' element={<Dashboard />} />
        <Route path='/admin/approvals/store' element={<StoreApplicationsPage />} />
        <Route path='/admin/approvals/store/:id' element={<StoreApplicationReview />} />


      </Routes>
    </BrowserRouter>
  )
}

export default App