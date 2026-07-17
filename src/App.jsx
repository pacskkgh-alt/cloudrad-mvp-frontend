import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import PatientPortal from './pages/PatientPortal';
import LoginPage from './pages/LoginPage';

function App() {
  const [doctor, setDoctor] = useState(null);

  useEffect(() => {
    // Check for existing auth on mount
    const savedToken = localStorage.getItem('cloudrad_token');
    const savedDoctor = localStorage.getItem('cloudrad_doctor');
    if (savedToken && savedDoctor) {
      try {
        setDoctor(JSON.parse(savedDoctor));
      } catch {
        localStorage.removeItem('cloudrad_token');
        localStorage.removeItem('cloudrad_doctor');
      }
    }
  }, []);

  const handleLogin = (data) => {
    setDoctor({
      id: data.doctor_id,
      name: data.full_name,
      email: data.email,
      clinic_id: data.clinic_id,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('cloudrad_token');
    localStorage.removeItem('cloudrad_doctor');
    setDoctor(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/patient/:token" element={<PatientPortal />} />
        <Route
          path="/login"
          element={
            doctor ? <Navigate to="/" replace /> : <LoginPage onLogin={handleLogin} />
          }
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            doctor ? (
              <Dashboard doctor={doctor} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
