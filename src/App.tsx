import { HashRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './pages/ErrorBoundary';
import Navbar from './components/Navbar';
import WhatsAppButton from './components/WhatsAppButton';
import BlogSyncManager from './components/BlogSyncManager';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Services from './pages/Services';
import Results from './pages/Results';
import Diagnosis from './pages/Diagnosis';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Blogs from './pages/Blogs';
import BlogDetail from './pages/BlogDetail';
import Appointment from './pages/Appointment';
import About from './pages/About';
import Contact from './pages/Contact';
import Faq from './pages/Faq';
import BlogAdminPage from './pages/BlogAdminPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminChatManager from './pages/AdminChatManager';
import AdminCalendarManager from './pages/AdminCalendarManager';
import AdminBlockSchedule from './pages/AdminBlockSchedule';
import AdminAppointment from './pages/AdminAppointment';
import AdminMonitor from './pages/AdminMonitor';
import AdminStats from './pages/AdminStats';
import AdminDiagnosis from './pages/AdminDiagnosis';
import AdminProtocols from './pages/AdminProtocols';
import PatientList from './components/admin/ficha-clinica/components/PatientList';
import NewPatientForm from './components/admin/ficha-clinica/components/NewPatientForm';
import PatientDetail from './components/admin/ficha-clinica/components/PatientDetail';
import ClinicalRecordManager from './components/admin/ficha-clinica/components/ClinicalRecordManager';
import ConsentSigning from './pages/ConsentSigning';

function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AuthProvider>
          <Navbar />
          <BlogSyncManager />
          <WhatsAppButton />
          <main className="pt-40 md:pt-44">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<Services />} />
              <Route path="/results" element={<Results />} />
              <Route path="/diagnosis" element={<Diagnosis />} />

              {/* RUTAS DE PRODUCTOS - el orden importa */}
              <Route path="/products/aparatologia" element={<Products initialCategory="equipment" />} />
              <Route path="/products/cosmeticos" element={<Products initialCategory="cosmetic" />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/products" element={<Products />} />

              {/* RUTAS DE BLOG */}
              <Route path="/blogs/:slug" element={<BlogDetail />} />
              <Route path="/blogs" element={<Blogs />} />
              <Route path="/blog-admin" element={<BlogAdminPage />} />

              {/* RUTAS ADMINISTRATIVAS CHATBOT */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/chats" element={<AdminChatManager />} />
              <Route path="/admin/calendar" element={<AdminCalendarManager />} />
              <Route path="/admin/block-schedule" element={<AdminBlockSchedule />} />
              <Route path="/admin/appointment" element={<AdminAppointment />} />
              <Route path="/admin/monitor" element={<AdminMonitor />} />
              <Route path="/admin/stats" element={<AdminStats />} />
              <Route path="/admin/diagnosis" element={<AdminDiagnosis />} />
              <Route path="/admin/protocols" element={<AdminProtocols />} />
              <Route path="/admin/clinical-records" element={<PatientList />} />
              <Route path="/admin/clinical-records/new" element={<NewPatientForm />} />
              <Route path="/admin/clinical-records/edit/:patientId" element={<NewPatientForm />} />
              <Route path="/admin/ficha-clinica/paciente/:patientId" element={<PatientDetail />} />
              <Route path="/admin/ficha-clinica/expediente/:recordId" element={<ClinicalRecordManager />} />
              
              {/* RUTA DE FIRMA REMOTA */}
              <Route path="/consent-signing/:token" element={<ConsentSigning />} />

              <Route path="/appointment" element={<Appointment />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<Faq />} />
            </Routes>
          </main>
        </AuthProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}

export default App;
