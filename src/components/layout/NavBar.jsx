import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Package, ShieldCheck, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function NavBar({ isMobileMenuOpen, setIsMobileMenuOpen }) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentCategory = searchParams.get('categoria');
  const { isAuthenticated } = useAuth();

  const adminPath = isAuthenticated ? '/admin' : '/admin/login';
  const adminText = isAuthenticated ? 'Panel Admin' : 'Acceso Admin';
  const AdminIcon = isAuthenticated ? ShieldCheck : Lock;

  const navLinks = [
    { to: '/catalogo', label: 'Catálogo', icon: Package, isCategory: false },
    { to: '/catalogo?categoria=tubos', label: 'Tubos', categorySlug: 'tubos', isCategory: true },
    { to: '/catalogo?categoria=planchas', label: 'Planchas', categorySlug: 'planchas', isCategory: true },
    { to: '/catalogo?categoria=perfiles', label: 'Perfiles', categorySlug: 'perfiles', isCategory: true },
    { to: '/catalogo?categoria=fierros', label: 'Fierros galvanizados', categorySlug: 'fierros', isCategory: true },
    { to: '/libro-de-reclamaciones', label: 'Libro de reclamaciones', isCategory: false }
  ];

  const isActiveLink = (link) => {
    if (link.to === '/libro-de-reclamaciones') {
      return location.pathname === '/libro-de-reclamaciones';
    }
    if (location.pathname === '/catalogo') {
      if (!link.isCategory) {
        return !currentCategory;
      }
      return currentCategory === link.categorySlug;
    }
    return false;
  };

  return (
    <nav className="bg-white text-slate-800 border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-between py-2.5">
          <div className="flex items-center space-x-6 lg:space-x-8">
            {navLinks.map((link) => {
              const active = isActiveLink(link);
              const Icon = link.icon;

              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={`text-sm sm:text-base font-bold transition-all flex items-center gap-2 py-1 relative ${
                    active
                      ? 'text-[#0284C7] border-b-3 border-[#0284C7]'
                      : 'text-slate-700 hover:text-[#0284C7]'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#0284C7]" />}
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Admin Access / Panel Button */}
          <Link
            to={adminPath}
            className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[44px] text-xs sm:text-sm font-bold rounded-xl border border-slate-300 bg-slate-100/90 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-400 shrink-0"
          >
            <AdminIcon className="w-4 h-4 text-slate-600" />
            <span>{adminText}</span>
          </Link>
        </div>

        {/* Mobile Navigation Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-3 space-y-1.5 border-t border-slate-100 animate-fade-in">
            {navLinks.map((link) => {
              const active = isActiveLink(link);
              const Icon = link.icon;

              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-base font-bold transition-colors flex items-center justify-between ${
                    active
                      ? 'bg-sky-50 text-[#0284C7]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {Icon && <Icon className="w-5 h-5 text-[#0284C7]" />}
                    <span>{link.label}</span>
                  </div>
                </NavLink>
              );
            })}

            <div className="pt-2 mt-2 border-t border-slate-200">
              <Link
                to={adminPath}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-3 min-h-[44px] rounded-xl text-base font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <AdminIcon className="w-5 h-5 text-slate-600" />
                <span>{adminText}</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
