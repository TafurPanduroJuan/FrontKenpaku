import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Header } from './Header';
import { NavBar } from './NavBar';
import { Footer } from './Footer';
import { CartDrawer } from '../cart/CartDrawer';
import { ChatWidget } from '../chat/ChatWidget';

export function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
