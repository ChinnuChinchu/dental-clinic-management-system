import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './auth/ProtectedRoute'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import AdminLayout from './pages/admin/AdminLayout'
import DoctorsAdmin from './pages/admin/DoctorsAdmin'
import DoctorSchedule from './pages/admin/DoctorSchedule'
import StaffAdmin from './pages/admin/StaffAdmin'
import BookAppointment from './pages/BookAppointment'
import Doctors from './pages/Doctors'
import Home from './pages/Home'
import Login from './pages/Login'
import MyAppointments from './pages/MyAppointments'
import Register from './pages/Register'
import GuestOnly from './auth/GuestOnly'
import PatientDashboard from './pages/PatientDashboard'
import Reception from './pages/reception/Reception'
import DoctorHome from './pages/doctor/DoctorHome'
import DoctorVisit from './pages/doctor/DoctorVisit'
import MyRecords from './pages/MyRecords'

function PageLayout() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Outlet />
    </main>
  )
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-silk text-lagoon">
      <Navbar />
      <div className="flex-1">
        <Routes>
          
            <Route path="/" element={<GuestOnly><Home /></GuestOnly>} />
            <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
            <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
          <Route element={<PageLayout />}>
          
          <Route path="/dashboard" element={<ProtectedRoute roles={['patient']}><PatientDashboard /></ProtectedRoute>} />
         <Route path="/doctor" element={<ProtectedRoute roles={['doctor']}><DoctorHome /></ProtectedRoute>} />
          <Route path="/doctor/visit/:apptId" element={<ProtectedRoute roles={['doctor']}><DoctorVisit /></ProtectedRoute>} />
          <Route path="/my-records" element={<ProtectedRoute roles={['patient']}><MyRecords /></ProtectedRoute>} />
            <Route
              path="/reception"
              element={<ProtectedRoute roles={['staff', 'admin']}><Reception /></ProtectedRoute>}
            />
            <Route path="/doctors" element={<Doctors />} />
       
            <Route
              path="/book/:doctorId"
              element={<ProtectedRoute roles={['patient']}><BookAppointment /></ProtectedRoute>}
            />
            <Route
              path="/my-appointments"
              element={<ProtectedRoute roles={['patient']}><MyAppointments /></ProtectedRoute>}
            />
            <Route
              path="/admin"
              element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}
            >
              <Route index element={<Navigate to="doctors" replace />} />
              <Route path="doctors" element={<DoctorsAdmin />} />
              <Route path="doctors/:doctorId/schedule" element={<DoctorSchedule />} />
              <Route path="staff" element={<StaffAdmin />} />
            </Route>
            <Route path="*" element={<p>Page not found.</p>} />
          </Route>
        </Routes>
      </div>
      <Footer />
    </div>
  )
}