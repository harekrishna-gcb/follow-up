import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import { AppShell } from './components/AppShell';
import Login from './pages/Login';
import Home from './pages/Home';
import Profile from './pages/Profile';
import ContactFormPage from './pages/ContactFormPage';
import Dashboard from './pages/Dashboard';
import Volunteers from './pages/Volunteers';
import Settings from './pages/Settings';

/** HashRouter (/#/contact/123) works on any static host without rewrite rules. */
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<Home />} />
            <Route path="contact/:id" element={<Profile />} />
            <Route path="contact/:id/edit" element={<ContactFormPage mode="edit" />} />
            <Route path="settings" element={<Settings />} />
            <Route element={<AdminRoute />}>
              <Route path="contact/new" element={<ContactFormPage mode="new" />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="volunteers" element={<Volunteers />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </HashRouter>
  );
}
