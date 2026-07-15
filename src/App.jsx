import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import PatientPortal from './pages/PatientPortal';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/patient/:token" element={<PatientPortal />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
