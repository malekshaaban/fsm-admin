import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Jobs } from './pages/Jobs';
import { Users } from './pages/Users';
import { Reviews } from './pages/Reviews';
import { Reports } from './pages/Reports';
import { Logs } from './pages/Logs';
import { Notifications } from './pages/Notifications';
import { Settings } from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/orders" element={<Jobs />} /> {/* Alias route from your prototype */}
        <Route path="/users" element={<Users />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;