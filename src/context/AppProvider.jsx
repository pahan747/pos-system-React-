import React from "react";
import { AuthProvider } from "./AuthContext";
import { OrganizationProvider } from "./OrganizationContext";
import { TableProvider } from "./TableContext";
import { CartProvider } from "./CartContext";
import { ServiceTypeProvider } from "./ServiceTypeContext";
import { TakeAwayProvider } from "./TakeAwayContext";
import { DeliveryProvider } from "./DeliveryContext";
import { CustomerProvider } from "./CustomerContext";

const AppProviders = ({ children }) => {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <TableProvider>
          <CartProvider>
            <ServiceTypeProvider>
              <TakeAwayProvider>
                <DeliveryProvider>
                  <CustomerProvider>{children}</CustomerProvider>
                </DeliveryProvider>
              </TakeAwayProvider>
            </ServiceTypeProvider>
          </CartProvider>
        </TableProvider>
      </OrganizationProvider>
    </AuthProvider>
  );
};

export default AppProviders;