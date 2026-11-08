import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, MessageCircle, Menu, X } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { buildWhatsAppUrl } from '../../utils/whatsapp';
import { sanitizeSearchQuery } from '../../utils/sanitizers';

export function Header({ isMobileMenuOpen, setIsMobileMenuOpen }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const { itemCount, toggleCart } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const cleanQuery = sanitizeSearchQuery(searchQuery).trim();
    if (cleanQuery) {
      navigate(`/catalogo?q=${encodeURIComponent(cleanQuery)}`);
      setIsMobileSearchOpen(false);
    }
  };

  const whatsappUrl = buildWhatsAppUrl('Hola Comercial Kenpaku, deseo consultar sobre precios de acero.');

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-steel-200/80 shadow-header'
          : 'bg-white border-b border-steel-200'
      }`}
    >
      <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Mobile Menu Toggle & Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-navy-900 hover:bg-steel-100 rounded-btn transition-colors"
            aria-label="Abrir menú de navegación"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <Link to="/" className="flex items-center gap-3 group select-none">
            {/* Logo Icon "K" cuadrado */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-extrabold text-2xl shadow-sm group-hover:from-brand-600 group-hover:to-brand-700 transition-all duration-200">
              K
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-xl text-navy-900 tracking-tight leading-none group-hover:text-brand-600 transition-colors">
                KENPAKU
              </span>
              <span className="text-micro text-steel-500 font-medium tracking-wide mt-0.5">
                Soluciones en acero
              </span>
            </div>
          </Link>
        </div>

        {/* Search Bar - Desktop */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-lg mx-6 relative">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-steel-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(sanitizeSearchQuery(e.target.value))}
              placeholder="¿Qué acero necesitas?"
              className="w-full pl-10 pr-4 py-2.5 rounded-btn border border-steel-200 bg-white/90 text-sm text-navy-900 placeholder-steel-500 shadow-inset focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 transition-all"
            />
          </div>
        </form>

        {/* Actions: Mobile Search Toggle, WhatsApp Button, Cart Icon */}
        <div className="flex items-center gap-3">
          {/* Mobile Search Icon Button */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="md:hidden p-2 text-navy-900 hover:bg-steel-100 rounded-btn transition-colors"
            aria-label="Buscar productos"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* WhatsApp Direct Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 bg-wa-600 hover:bg-wa-700 text-white text-xs font-semibold rounded-btn shadow-wa transition-all active:scale-[0.98]"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Hablar por WhatsApp</span>
          </a>

          {/* Cart Icon Button with Badge */}
          <button
            onClick={toggleCart}
            className="relative p-2.5 bg-steel-100 hover:bg-steel-200/80 text-navy-900 rounded-btn border border-steel-200 hover:border-steel-300 transition-all flex items-center justify-center active:scale-[0.98]"
            aria-label="Ver carrito de compras"
          >
            <ShoppingCart className="w-5 h-5 text-navy-900" />
            {itemCount > 0 && (
              <span className="num animate-bump absolute -top-1.5 -right-1.5 bg-accent-600 text-white text-micro font-extrabold min-w-5 h-5 px-1 rounded-full flex items-center justify-center ring-2 ring-white shadow-cta-soft">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar Dropdown */}
      {isMobileSearchOpen && (
        <div className="md:hidden px-4 pb-3 pt-1 border-t border-steel-200 bg-steel-50 animate-fade-in">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(sanitizeSearchQuery(e.target.value))}
              placeholder="¿Qué acero necesitas?"
              className="w-full pl-10 pr-20 py-2.5 rounded-btn border border-steel-200 text-sm text-navy-900 bg-white placeholder-steel-500 shadow-inset focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              autoFocus
            />
            <Search className="w-4 h-4 text-steel-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-btn shadow-sm transition-colors"
            >
              Buscar
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
