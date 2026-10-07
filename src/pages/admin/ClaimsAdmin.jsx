import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertOctagon, BookOpen, Eye, Phone, Mail } from 'lucide-react';
import { getAdminClaims } from '../../api/admin';
import { Skeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { formatPEN } from '../../utils/formatPEN';

export function ClaimsAdmin() {
  const [selectedClaim, setSelectedClaim] = useState(null);

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ['admin-claims'],
    queryFn: getAdminClaims
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-extrabold text-kenpaku-navy flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-amber-500" />
          <span>Libro de Reclamaciones (Registros)</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Gestión y seguimiento formal de reclamos y quejas ingresados por consumidores
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-10" />
          </div>
        ) : claims.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No hay reclamaciones registradas en el sistema.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Código / Fecha</th>
                  <th className="py-3.5 px-4">Consumidor</th>
                  <th className="py-3.5 px-4">Documento</th>
                  <th className="py-3.5 px-4">Tipo</th>
                  <th className="py-3.5 px-4">Bien Afectado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {claims.map((claim) => (
                  <tr key={claim.codigo_seguimiento} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-kenpaku-navy block">{claim.codigo_seguimiento}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(claim.fecha).toLocaleDateString('es-PE')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{claim.nombre}</td>
                    <td className="py-3.5 px-4 font-semibold">{claim.documento}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          claim.tipo === 'reclamo'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {claim.tipo}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate">{claim.descripcion_bien}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedClaim(claim)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                      >
                        Ver Reclamación
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Claim Detail Modal */}
      {selectedClaim && (
        <Modal
          isOpen={!!selectedClaim}
          onClose={() => setSelectedClaim(null)}
          title={`Hoja de Reclamación ${selectedClaim.codigo_seguimiento}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs text-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Consumidor</span>
                <p className="font-bold text-slate-900">{selectedClaim.nombre}</p>
                <p>Doc: {selectedClaim.documento}</p>
                <p>Teléfono: {selectedClaim.telefono}</p>
                <p>Correo: {selectedClaim.correo}</p>
                <p>Dirección: {selectedClaim.direccion}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Detalles del Bien</span>
                <p><strong>Tipo:</strong> {selectedClaim.tipo_bien}</p>
                <p><strong>Monto:</strong> {selectedClaim.monto_reclamado ? formatPEN(selectedClaim.monto_reclamado) : 'N/A'}</p>
                <p><strong>Descripción:</strong> {selectedClaim.descripcion_bien}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div>
                <span className="font-bold text-slate-900 block">Detalle de los Hechos:</span>
                <p className="text-slate-600 leading-relaxed">{selectedClaim.detalle}</p>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-900 block">Pedido del Consumidor:</span>
                <p className="text-slate-600 leading-relaxed">{selectedClaim.pedido_consumidor}</p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
