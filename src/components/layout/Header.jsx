import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, MessageCircle, Menu, X } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { buildWhatsAppUrl } from '../../utils/whatsapp';

export function Header({ isMobileMenuOpen, setIsMobileMenuOpen }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const navigate = useNavigate();
  const { itemCount, toggleCart } = useCart();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalogo?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileSearchOpen(false);
    }
  };

  const whatsappUrl = buildWhatsAppUrl('Hola Comercial Kenpaku, deseo consultar sobre precios de acero.');

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Mobile Menu Toggle & Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg"
            aria-label="Abrir menú de navegación"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <Link to="/" className="flex items-center gap-2.5 group">
            {/* Logo Icon Cyan Square */}
            <div className="w-10 h-10 rounded-xl bg-[#0284C7] flex items-center justify-center text-white font-black text-2xl shadow-sm group-hover:bg-[#0369A1] transition-colors">
              K
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl text-[#0A2540] tracking-tight leading-none group-hover:text-[#0284C7] transition-colors">
                KENPAKU
              </span>
              <span className="text-[11px] text-slate-500 font-medium tracking-wide">
                Soluciones en acero
              </span>
            </div>
          </Link>
        </div>

        {/* Search Bar - Desktop */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-lg mx-6 relative">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="¿Qué acero necesitas?"
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 transition-all"
            />
          </div>
        </form>

        {/* Actions: Mobile Search Toggle, WhatsApp Button, Cart Icon */}
        <div className="flex items-center gap-3">
          {/* Mobile Search Icon Button */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg"
            aria-label="Buscar productos"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* WhatsApp Direct Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Hablar por WhatsApp</span>
          </a>

          {/* Cart Icon Button with Badge */}
          <button
            onClick={toggleCart}
            className="relative p-2.5 bg-slate-100 hover:bg-slate-200 text-[#0A2540] rounded-xl transition-colors flex items-center justify-center"
            aria-label="Ver carrito de compras"
          >
            <ShoppingCart className="w-5 h-5 text-[#0A2540]" />
            <span className="absolute -top-1 -right-1 bg-[#EA580C] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
              {itemCount}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Search Bar Dropdown */}
      {isMobileSearchOpen && (
        <div className="md:hidden px-4 pb-3 pt-1 border-t border-slate-100 bg-slate-50 animate-fade-in">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="¿Qué acero necesitas?"
              className="w-full pl-10 pr-20 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              autoFocus
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#0284C7] text-white text-xs font-bold rounded-lg"
            >
              Buscar
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
