import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Filter, Search } from 'lucide-react';
import { getCategories } from '../api/categories';
import { getProducts } from '../api/products';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { FilterSidebar } from '../components/catalog/FilterSidebar';
import { FilterDrawer } from '../components/catalog/FilterDrawer';
import { SortSelect } from '../components/catalog/SortSelect';
import { ProductGrid } from '../components/catalog/ProductGrid';
import { Pagination } from '../components/catalog/Pagination';
import { useDebounce } from '../hooks/useDebounce';

export function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Read URL query params
  const categoria = searchParams.get('categoria') || '';
  const acabado = searchParams.get('acabado') || '';
  const min = searchParams.get('min') || '';
  const max = searchParams.get('max') || '';
  const stock = searchParams.get('stock') || '';
  const qParam = searchParams.get('q') || '';
  const orden = searchParams.get('orden') || 'relevancia';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Local state for search input to enable debounce
  const [searchTerm, setSearchTerm] = useState(qParam);
  const debouncedSearchTerm = useDebounce(searchTerm, 350);

  // Sync debounced search to URL params
  useEffect(() => {
    setSearchTerm(qParam);
  }, [qParam]);

  useEffect(() => {
    if (debouncedSearchTerm !== qParam) {
      updateFilterParam('q', debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  // Query categories for sidebar count
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories
  });

  // Query products with active filters
  const { data: productsData, isLoading, isFetching } = useQuery({
    queryKey: ['products', { categoria, acabado, min, max, stock, q: qParam, orden, page }],
    queryFn: () =>
      getProducts({
        categoria,
        acabado,
        min_precio: min,
        max_precio: max,
        solo_stock: stock === 'true',
        q: qParam,
        orden,
        page,
        page_size: 12
      })
  });

  const products = productsData?.items || [];
  const totalResults = productsData?.total || 0;

  // Helper to update URL search params
  const updateFilterParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Reset page to 1 when changing filters other than page itself
    if (key !== 'page') {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSearchParams(new URLSearchParams());
  };

  const handleAskAdvisor = () => {
    const chatBtn = document.querySelector('button[aria-label="Abrir Asesor Virtual de IA"]');
    if (chatBtn) chatBtn.click();
  };

  const activeFiltersObj = { categoria, acabado, min, max, stock, q: qParam };

  return (
    <div className="space-y-6 py-2">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Catálogo de Acero' }]} />

      {/* Title & Mobile Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-kenpaku-navy">
            Catálogo de Acero
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tubos, planchas, perfiles y fierros con stock en tienda de Puente Piedra
          </p>
        </div>

        {/* Search input in catalog page header */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar por nombre o medida..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-kenpaku-blue"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className="md:hidden flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-kenpaku-navy text-white text-xs font-bold shrink-0 min-h-[44px]"
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </button>
        </div>
      </div>

      {/* Main Catalog Grid & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:col-span-3 sticky top-24">
          <FilterSidebar
            categories={categories}
            filters={activeFiltersObj}
            onFilterChange={updateFilterParam}
            onResetFilters={handleResetFilters}
            totalResults={totalResults}
          />
        </div>

        {/* Mobile Filter Drawer */}
        <FilterDrawer
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          categories={categories}
          filters={activeFiltersObj}
          onFilterChange={updateFilterParam}
          onResetFilters={handleResetFilters}
          totalResults={totalResults}
        />

        {/* Product Grid Area */}
        <div className="lg:col-span-9 space-y-6">
          {/* Top Control Bar: Result count & Sort */}
          <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
            <span className="text-xs font-semibold text-slate-700">
              {isLoading || isFetching
                ? 'Cargando productos...'
                : `Mostrando ${totalResults} ${totalResults === 1 ? 'resultado' : 'resultados'}`}
            </span>

            <SortSelect
              value={orden}
              onChange={(val) => updateFilterParam('orden', val)}
            />
          </div>

          {/* Grid Component */}
          <ProductGrid
            products={products}
            isLoading={isLoading}
            onAskAdvisor={handleAskAdvisor}
          />

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalItems={totalResults}
            pageSize={12}
            onPageChange={(newPage) => updateFilterParam('page', newPage.toString())}
          />
        </div>
      </div>
    </div>
  );
}
