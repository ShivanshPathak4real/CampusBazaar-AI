import { Routes, Route } from 'react-router-dom';
import { PublicLayout, RequireAuth, RequireAdmin } from './components/Layout';

import Home from './pages/Home';
import Browse from './pages/Browse';
import ProductDetails from './pages/ProductDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import Sell from './pages/Sell';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import { About, Help, Terms, Privacy, Safety } from './pages/StaticPages';

import DashboardLayout from './pages/dashboard/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import MyListings from './pages/dashboard/MyListings';
import Saved from './pages/dashboard/Saved';
import Transactions from './pages/dashboard/Transactions';
import Rentals from './pages/dashboard/Rentals';
import Exchanges from './pages/dashboard/Exchanges';
import Messages from './pages/dashboard/Messages';
import Notifications from './pages/dashboard/Notifications';

import AdminLayout from './pages/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminListings from './pages/admin/AdminListings';
import AdminReports from './pages/admin/AdminReports';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/listing/:id" element={<ProductDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/sell" element={<Sell />} />
        <Route path="/user/:id" element={<UserProfile />} />
        <Route path="/about" element={<About />} />
        <Route path="/help" element={<Help />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/safety" element={<Safety />} />

        <Route element={<RequireAuth />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Overview />} />
            <Route path="listings" element={<MyListings />} />
            <Route path="saved" element={<Saved />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="rentals" element={<Rentals />} />
            <Route path="exchanges" element={<Exchanges />} />
            <Route path="messages" element={<Messages />} />
            <Route path="messages/:conversationId" element={<Messages />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>
        </Route>

        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="listings" element={<AdminListings />} />
            <Route path="reports" element={<AdminReports />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="font-display text-2xl font-semibold">Page not found</p>
      <p className="mt-2 text-sm text-ink-soft">The page you're looking for doesn't exist.</p>
    </div>
  );
}
