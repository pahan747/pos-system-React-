import React from 'react';
import { BrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { OrganizationProvider } from './context/OrganizationContext';
import { TableProvider } from './context/TableContext';
import { router } from './route/router';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OrganizationProvider>
          <TableProvider>
                <RouterProvider router={router} />
          </TableProvider>
        </OrganizationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App; 