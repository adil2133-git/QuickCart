import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import QuickKartLogin from './auth/login'
import CreateAccountModal from './auth/createAccountModel'
import CustomerRegistration from './auth/customerRegistration'
import StoreRegistration from './auth/storeRegistration'
import DeliveryPartnerRegistration from './auth/deliveryPartnerRegistration'
import CustomerHome from './pages/customer/customerHome'
import FreshMartStorePage from './pages/customer/singleStore'

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

        <Route path="/home" element={<CustomerHome />} />

        <Route path='/store' element={<FreshMartStorePage />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App