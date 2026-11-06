import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit, Trash2, Save, ImageOff } from 'lucide-react';
import { getAdminProducts, updateQuickStockPrice, deleteAdminProduct } from '../../api/admin';
import { Link } from 'react-router-dom';
import { formatPEN } from '../../utils/formatPEN';
import { Skeleton } from '../../components/ui/Skeleton';
import { StockBadge } from '../../components/catalog/StockBadge';
import { Modal } from '../../components/ui/Modal';
import { Toast } from '../../components/ui/Toast';
import {
  sanitizeSearchQuery,
  sanitizePositiveInteger,
  sanitizePositiveDecimal,
  preventNonIntegerKeys,
  preventNegativeAndExpKeys
} from '../../utils/sanitizers';

export function Products() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyMissingImages, setOnlyMissingImages] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [quickStock, setQuickStock] = useState('');
  const [quickPrice, setQuickPrice] = useState('');

  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['admin-products', searchTerm, onlyMissingImages],
    queryFn: () => getAdminProducts({ q: searchTerm, page_size: 50, sin_imagen: onlyMissingImages || undefined })
  });

  const quickUpdateMutation = useMutation({
    mutationFn: ({ id, stock_disponible, precio_unitario }) =>
      updateQuickStockPrice(id, { stock_disponible, precio_unitario }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditingProduct(null);
      setToastMsg(`Stock y precio actualizados para "${data.nombre}".`);
      setShowToast(true);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAdminProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setToastMsg('Producto dado de baja lógicamente.');
      setShowToast(true);
    }
  });

  const products = productsData?.items || [];

  const handleOpenQuickEdit = (product) => {
    setEditingProduct(product);
    setQuickStock(product.stock_disponible.toString());
    setQuickPrice(product.precio_unitario.toString());
  };

  const handleSaveQuickEdit = (e) => {
    e.preventDefault();
    if (editingProduct) {
      quickUpdateMutation.mutate({
        id: editingProduct.id,
        stock_disponible: parseFloat(quickStock),
        ...(editingProduct.precio_base_usd == null
          ? { precio_unitario: parseFloat(quickPrice) }
          : {})
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Toast message={toastMsg} isVisible={showToast} onClose={() => setShowToast(false)} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-kenpaku-navy">Gestión de Catálogo (Productos)</h2>
          <p className="text-xs text-slate-500 mt-0.5">Creación, edición rápida de stock/precio y baja lógica de ítems</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to="/admin/productos/importar" className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg min-h-[44px]">
            Importar lista
          </Link>
          <Link
            to="/admin/productos/nuevo"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-kenpaku-orange hover:bg-kenpaku-orangeHover text-white text-xs font-bold rounded-xl shadow-xs transition-all min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </Link>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(sanitizeSearchQuery(e.target.value))}
          placeholder="Buscar producto por nombre, medida o categoría..."
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-kenpaku-blue"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
      </div>
      <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
        <input type="checkbox" checked={onlyMissingImages} onChange={(event) => setOnlyMissingImages(event.target.checked)} />
        Mostrar solo productos sin imagen
      </label>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-10" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No se encontraron productos registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Producto</th>
                  <th className="py-3.5 px-4">Categoría</th>
                  <th className="py-3.5 px-4">Acabado / Medida</th>
                  <th className="py-3.5 px-4">Costo USD / TC / Margen</th>
                  <th className="py-3.5 px-4">Precio (S/)</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {p.imagen_url ? (
                          <img src={p.imagen_url} alt={p.nombre} className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0" />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-100 text-slate-500" title="Sin imagen">
                            <ImageOff className="h-4 w-4" />
                            <span className="text-[7px] font-semibold">Sin imagen</span>
                          </span>
                        )}
                        <span className="font-bold text-slate-900 line-clamp-1 max-w-xs">{p.nombre}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold uppercase text-slate-500">{p.categoria}</td>
                    <td className="py-3.5 px-4">
                      <span>{p.acabado}</span> • <span className="text-slate-500">{p.medida}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {p.precio_base_usd == null ? (
                        <span className="text-slate-400">Precio manual</span>
                      ) : (
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-800">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 4 }).format(Number(p.precio_base_usd))}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            TC {p.tipo_cambio_usado ?? 'sin dato'} · Margen {p.margen_aplicado_pct ?? p.margen_pct ?? '—'}%
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-kenpaku-navy">{formatPEN(p.precio_unitario)}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.stock_disponible} und.</td>
                    <td className="py-3.5 px-4">
                      <StockBadge status={p.stock_estado} />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenQuickEdit(p)}
                        className="p-1.5 bg-blue-50 text-kenpaku-blue hover:bg-blue-100 rounded-lg transition-colors"
                        title="Edición Rápida de Stock y Precio"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <Link
                        to={`/admin/productos/${p.id}`}
                        className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors inline-block"
                        title="Editar completo"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Confirmar baja lógica del producto "${p.nombre}"?`)) {
                            deleteMutation.mutate(p.id);
                          }
                        }}
                        className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Baja lógica"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Edit Modal */}
      {editingProduct && (
        <Modal
          isOpen={!!editingProduct}
          onClose={() => setEditingProduct(null)}
          title={`Edición Rápida: ${editingProduct.nombre}`}
        >
          <form onSubmit={handleSaveQuickEdit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Precio Unitario (S/ IGV incl.)</label>
              <input
                type="number"
                min="0.01"
                step="0.10"
                value={quickPrice}
                readOnly={editingProduct.precio_base_usd != null}
                onKeyDown={preventNegativeAndExpKeys}
                onChange={(e) => setQuickPrice(sanitizePositiveDecimal(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold"
                required
              />
              {editingProduct.precio_base_usd != null && (
                <p className="mt-1 text-[10px] text-slate-500">Calculado desde el costo USD y los márgenes de configuración.</p>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Stock Disponible (Unidades)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={quickStock}
                onKeyDown={preventNonIntegerKeys}
                onChange={(e) => setQuickStock(sanitizePositiveInteger(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold"
                required
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-kenpaku-blue hover:bg-kenpaku-blueHover text-white rounded-lg font-bold"
              >
                Guardar cambios
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
