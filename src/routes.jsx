import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { Layout } from './components/layout/Layout';
import { AdminLayout } from './components/layout/AdminLayout';

import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { ProductDetail } from './pages/ProductDetail';
import { Checkout } from './pages/Checkout';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { Claims } from './pages/Claims';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { NotFound } from './pages/NotFound';

import { Login } from './pages/admin/Login';
import { Dashboard } from './pages/admin/Dashboard';
import { Orders } from './pages/admin/Orders';
import { Products } from './pages/admin/Products';
import { ProductForm } from './pages/admin/ProductForm';
import { Knowledge } from './pages/admin/Knowledge';
import { ChatLogs } from './pages/admin/ChatLogs';
import { ClaimsAdmin } from './pages/admin/ClaimsAdmin';

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
      { path: 'libro-de-reclamaciones', element: <Claims /> },
      { path: 'politica-de-privacidad', element: <Privacy /> },
      { path: 'terminos', element: <Terms /> },
      { path: '*', element: <NotFound /> }
    ]
  },
  {
    path: '/admin/login',
    element: <Login />
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'pedidos', element: <Orders /> },
      { path: 'pedidos/:id', element: <Orders /> },
      { path: 'productos', element: <Products /> },
      { path: 'productos/nuevo', element: <ProductForm /> },
      { path: 'productos/:id', element: <ProductForm /> },
      { path: 'conocimiento', element: <Knowledge /> },
      { path: 'chat', element: <ChatLogs /> },
      { path: 'reclamos', element: <ClaimsAdmin /> }
    ]
  }
]);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}
