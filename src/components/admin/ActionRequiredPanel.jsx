import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Truck, Receipt, Timer, FileWarning, CheckCircle2 } from 'lucide-react';
import { getAdminActionRequired } from '../../api/admin';
import { Skeleton } from '../ui/Skeleton';
import { formatPEN } from '../../utils/formatPEN';

const GROUPS = [
  { key: 'flete_por_cotizar', title: 'Flete por cotizar', icon: Truck, color: 'bg-amber-100 text-amber-700' },
  { key: 'voucher_por_validar', title: 'Voucher por validar', icon: Receipt, color: 'bg-blue-100 text-kenpaku-blue' },
  { key: 'pedidos_por_vencer', title: 'Pedidos por vencer', icon: Timer, color: 'bg-red-100 text-red-700' },
];

const MAX_ITEMS = 5;

export function ActionRequiredPanel() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-action-required'],
    queryFn: getAdminActionRequired,
  });

  const total = data?.total_acciones || 0;
  const reclamos = data?.reclamos_pendientes || 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-soft space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold text-kenpaku-navy">Acciones de hoy</h3>
        {!isLoading && !isError && (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-kenpaku-orange text-white">
            {total}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2 py-2">
          <Skeleton className="w-full h-10" />
          <Skeleton className="w-full h-10" />
        </div>
      ) : isError ? (
        <p className="text-xs text-red-600 py-2">No se pudieron cargar las acciones pendientes.</p>
      ) : total === 0 ? (
        <div className="flex items-center gap-2 text-xs text-emerald-700 py-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Todo al día: no hay pedidos ni reclamos que requieran acción.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {GROUPS.map(({ key, title, icon: Icon, color }) => {
            const items = data?.[key] || [];
            if (items.length === 0) return null;
            return (
              <div key={key} className="rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    {title} ({items.length})
                  </span>
                </div>
                <ul className="space-y-2">
                  {items.slice(0, MAX_ITEMS).map((o) => (
                    <li key={o.id}>
                      <Link
                        to={`/admin/pedidos?q=${encodeURIComponent(o.codigo)}`}
                        className="block rounded-xl p-2 hover:bg-slate-50"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-kenpaku-navy">{o.codigo}</span>
                          <span className="font-bold text-slate-900">{formatPEN(o.total)}</span>
                        </div>
                        <span className="block text-[11px] text-slate-500">{o.cliente_nombre}</span>
                        <span className="block text-[11px] text-slate-400">{o.motivo}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {items.length > MAX_ITEMS && (
                  <Link to="/admin/pedidos" className="text-[11px] font-bold text-kenpaku-blue hover:underline">
                    {`Ver ${items.length - MAX_ITEMS} más →`}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && !isError && reclamos > 0 && (
        <Link
          to="/admin/reclamos"
          className="flex items-center gap-2 rounded-xl bg-purple-50 border border-purple-100 px-4 py-3 text-xs font-bold text-purple-800 hover:bg-purple-100"
        >
          <FileWarning className="w-4 h-4" />
          <span>{`${reclamos} ${reclamos === 1 ? 'reclamo pendiente' : 'reclamos pendientes'}`}</span>
        </Link>
      )}
    </div>
  );
}