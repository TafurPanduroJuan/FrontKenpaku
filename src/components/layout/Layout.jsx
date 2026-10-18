import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Header } from './Header';
import { NavBar } from './NavBar';
import { Footer } from './Footer';
import { CartDrawer } from '../cart/CartDrawer';
import { ChatWidget } from '../chat/ChatWidget';
import { useAuth } from '../../context/AuthContext';
import { ADMIN_ENTRY_PATH } from '../../utils/constants';

export function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Atajo seguro: (Ctrl o Cmd en Mac) + (Shift o Alt) + K
      if ((e.ctrlKey || e.metaKey) && (e.shiftKey || e.altKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (isAuthenticated) {
          navigate(role === 'cajero' ? '/caja' : '/admin');
        } else {
          navigate(ADMIN_ENTRY_PATH);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, isAuthenticated]);

  return (
    <div className="min-h-screen flex flex-col bg-kenpaku-bg text-slate-800 font-sans">
      <TopBar />
      <Header isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <NavBar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      <Footer />

      {/* Slide-over Cart Drawer */}
      <CartDrawer />

      {/* Floating AI Virtual Advisor Widget (Available on ALL public pages) */}
      <ChatWidget />
    </div>
  );
}
