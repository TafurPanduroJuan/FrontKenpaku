import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Package, Truck, FileText } from 'lucide-react';

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
    { to: '/seguimiento', label: 'Seguir mi pedido', icon: Truck, isCategory: false },
    { to: '/cotizador', label: 'Cotizar lista', icon: FileText, isCategory: false },
    { to: '/libro-de-reclamaciones', label: 'Libro de reclamaciones', isCategory: false }
  ];

  const isActiveLink = (link) => {
    if (link.to === '/seguimiento') {
      return location.pathname === '/seguimiento';
    }
    if (link.to === '/cotizador') {
      return location.pathname === '/cotizador';
    }
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
    <nav className="bg-white text-navy-900 border-b border-steel-200">
      <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-center py-2">
          <div className="flex items-center justify-center space-x-6 lg:space-x-8">
            {navLinks.map((link) => {
              const active = isActiveLink(link);
              const Icon = link.icon;

              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={`group text-sm font-semibold transition-all flex items-center gap-2 py-2 relative select-none ${
                    active
                      ? 'text-navy-900'
                      : 'text-steel-600 hover:text-navy-900'
                  }`}
                >
                  {Icon && (
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        active ? 'text-accent-600' : 'text-brand-500 group-hover:text-brand-600'
                      }`}
                    />
                  )}
                  <span>{link.label}</span>
                  {/* Underline animado acento Figma */}
                  <span
                    className={`absolute bottom-0 left-0 right-0 h-0.5 bg-accent-500 rounded-full transition-transform duration-200 ${
                      active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100 opacity-80'
                    }`}
                  />
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Mobile Navigation Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-3 space-y-1 border-t border-steel-200 animate-fade-in max-h-[70vh] overflow-y-auto">
            {navLinks.map((link) => {
              const active = isActiveLink(link);
              const Icon = link.icon;

              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-2.5 rounded-btn text-sm font-semibold transition-all flex items-center justify-between ${
                    active
                      ? 'bg-orange-50 text-accent-700 font-bold border border-accent-500/30'
                      : 'text-steel-600 hover:text-navy-900 hover:bg-steel-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {Icon && (
                      <Icon
                        className={`w-4 h-4 ${
                          active ? 'text-accent-600' : 'text-brand-500'
                        }`}
                      />
                    )}
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
