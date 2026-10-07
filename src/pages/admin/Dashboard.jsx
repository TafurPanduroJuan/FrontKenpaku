import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, Clock, MessageSquare, ExternalLink, Package, BrainCircuit, AlertOctagon } from 'lucide-react';
import { getAdminDashboard, getAdminOrders } from '../../api/admin';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatPEN } from '../../utils/formatPEN';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: getAdminDashboard
  });

  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: () => getAdminOrders({ limit: 5 })
  });

  const recentOrders = ordersData?.items || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-kenpaku-navy to-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Comercial Kenpaku S.A.C.</span>
          <h2 className="text-2xl font-extrabold mt-1">Resumen del Panel de Control</h2>
          <p className="text-xs text-slate-300 mt-1">Gestión integral de pedidos de acero, catálogo y Asesor Virtual IA</p>
        </div>

        <Link
          to="/admin/productos/nuevo"
          className="px-4 py-2.5 bg-kenpaku-orange hover:bg-kenpaku-orangeHover text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0"
        >
          + Crear Nuevo Producto
        </Link>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pedidos Pendientes</span>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          {loadingMetrics ? (
            <Skeleton className="w-16 h-8" />
          ) : (
            <span className="text-3xl font-extrabold text-kenpaku-navy block">
              {metrics?.pedidos_pendientes || 0}
            </span>
          )}
          <span className="text-[11px] text-slate-400">Por confirmar flete y precio</span>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pedidos Hoy</span>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-kenpaku-blue flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          {loadingMetrics ? (
            <Skeleton className="w-16 h-8" />
          ) : (
            <span className="text-3xl font-extrabold text-kenpaku-navy block">
              {metrics?.pedidos_hoy || 0}
            </span>
          )}
          <span className="text-[11px] text-slate-400">Registrados en la plataforma</span>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Consultas Chat IA</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          {loadingMetrics ? (
            <Skeleton className="w-16 h-8" />
          ) : (
            <span className="text-3xl font-extrabold text-kenpaku-navy block">
              {metrics?.consultas_chat || 0}
            </span>
          )}
          <span className="text-[11px] text-slate-400">Atendidas por Asesor Virtual</span>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">% Consultas Derivadas</span>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <ExternalLink className="w-5 h-5" />
            </div>
          </div>
          {loadingMetrics ? (
            <Skeleton className="w-16 h-8" />
          ) : (
            <span className="text-3xl font-extrabold text-kenpaku-navy block">
              {metrics?.porcentaje_derivadas || 0} %
            </span>
          )}
          <span className="text-[11px] text-slate-400">Handoff directo a WhatsApp</span>
        </div>
      </div>

      {/* Recent Orders Summary */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-kenpaku-navy">Últimos Pedidos Registrados</h3>
          <Link to="/admin/pedidos" className="text-xs font-bold text-kenpaku-blue hover:underline">
            Ver todos los pedidos &rarr;
          </Link>
        </div>

        {loadingOrders ? (
          <div className="space-y-2 py-4">
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-10" />
          </div>
        ) : recentOrders.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No hay pedidos registrados aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Teléfono</th>
                  <th className="py-3 px-4">Modalidad</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((o) => (
                  <tr key={o.codigo} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-kenpaku-navy">{o.codigo}</td>
                    <td className="py-3 px-4 font-semibold">{o.cliente?.nombre}</td>
                    <td className="py-3 px-4">{o.cliente?.telefono}</td>
                    <td className="py-3 px-4">{o.recojo_en_tienda ? 'Recojo en Tienda' : 'Despacho a Obra'}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{formatPEN(o.total)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        {o.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
