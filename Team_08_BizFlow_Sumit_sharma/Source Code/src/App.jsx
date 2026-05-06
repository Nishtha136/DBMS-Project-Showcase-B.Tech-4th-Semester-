import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login      from './pages/Login';
import SignUp     from './pages/SignUp';
import Dashboard  from './pages/Dashboard';
import Inventory  from './pages/Inventory';
import Purchase   from './pages/Purchase';
import Sales      from './pages/Sales';
import Production from './pages/Production';
import HR         from './pages/HR';
import Maintenance from './pages/Maintenance';
import Reports from './pages/Reports';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"       element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        
        <Route path="/dashboard"  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/inventory"  element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
        <Route path="/purchase"   element={<ProtectedRoute><Purchase /></ProtectedRoute>} />
        <Route path="/sales"      element={<ProtectedRoute><Sales /></ProtectedRoute>} />
        <Route path="/production" element={<ProtectedRoute><Production /></ProtectedRoute>} />
        <Route path="/hr"         element={<ProtectedRoute><HR /></ProtectedRoute>} />
        <Route path="/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;