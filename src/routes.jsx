import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

import { Layout } from './components/layout/Layout';
import { AdminLayout } from './components/layout/AdminLayout';

import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { ProductDetail } from './pages/ProductDetail';
import { Checkout } from './pages/Checkout';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { TrackingPage } from './pages/TrackingPage';
import { Claims } from './pages/Claims';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { NotFound } from './pages/NotFound';

import { Login } from './pages/admin/Login';
import { Dashboard } from './pages/admin/Dashboard';
import { Products } from './pages/admin/Products';
import { ProductForm } from './pages/admin/ProductForm';
import { Knowledge } from './pages/admin/Knowledge';
import { ChatLogs } from './pages/admin/ChatLogs';
import { ClaimsAdmin } from './pages/admin/ClaimsAdmin';
import { AdminVentas } from './pages/admin/AdminVentas';
import { CajeroLayout } from './components/layout/CajeroLayout';
import { PosView } from './pages/cajero/PosView';
import { CajeroMisVentas } from './pages/cajero/CajeroMisVentas';
import { CajeroOrders } from './pages/cajero/CajeroOrders';
import { CajeroProfile } from './pages/cajero/CajeroProfile';
import { ADMIN_ENTRY_PATH } from './utils/constants';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Home /> },
      { path: 'catalogo', element: <Catalog /> },
      { path: 'producto/:id', element: <ProductDetail /> },
      { path: 'checkout', element: <Checkout /> },
      { path: 'pedido/:codigo', element: <OrderConfirmation /> },
      { path: 'seguimiento', element: <TrackingPage /> },
      { path: 'libro-de-reclamaciones', element: <Claims /> },
      { path: 'politica-de-privacidad', element: <Privacy /> },
      { path: 'terminos', element: <Terms /> },
      { path: '*', element: <NotFound /> }
    ]
  },
  {
    path: ADMIN_ENTRY_PATH,
    element: <Login />
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'productos', element: <Products /> },
      { path: 'productos/nuevo', element: <ProductForm /> },
      { path: 'productos/:id', element: <ProductForm /> },
      { path: 'ventas', element: <AdminVentas /> },
      { path: 'conocimiento', element: <Knowledge /> },
      { path: 'chat', element: <ChatLogs /> },
      { path: 'reclamos', element: <ClaimsAdmin /> },
      { path: 'pedidos', element: <Navigate to="/caja/pedidos" replace /> },
      { path: '*', element: <NotFound /> }
    ]
  },
  {
    path: '/caja',
    element: <CajeroLayout />,
    children: [
      { index: true, element: <PosView /> },
      { path: 'mis-ventas', element: <CajeroMisVentas /> },
      { path: 'pedidos', element: <CajeroOrders /> },
      { path: 'pedidos/:id', element: <CajeroOrders /> },
      { path: 'ventas-virtuales', element: <CajeroOrders /> },
      { path: 'perfil', element: <CajeroProfile /> },
      { path: '*', element: <NotFound /> }
    ]
  },
  {
    path: '*',
    element: <NotFound />
  }
]);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}
