import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import { OrganizationProvider } from './context/OrganizationContext';
import { TableProvider } from './context/TableContext';
import { CartProvider } from './context/CartContext';
import { ServiceTypeProvider } from './context/ServiceTypeContext';
import OrderSummary from './components/OrderSummary';
import BottomBar from './components/BottomBar';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OrganizationProvider>
          <TableProvider>
            <CartProvider>
              <ServiceTypeProvider>
                <div className="app">
                  <AppRoutes />
                  <OrderSummary />
                  <BottomBar />
                </div>
              </ServiceTypeProvider>
            </CartProvider>
          </TableProvider>
        </OrganizationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App; 