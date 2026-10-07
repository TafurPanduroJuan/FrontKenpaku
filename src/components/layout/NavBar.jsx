import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Package } from 'lucide-react';

export function NavBar({ isMobileMenuOpen, setIsMobileMenuOpen }) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentCategory = searchParams.get('categoria');

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
        <div className="hidden md:flex items-center space-x-8 py-3.5">
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
          </div>
        )}
      </div>
    </nav>
  );
}
