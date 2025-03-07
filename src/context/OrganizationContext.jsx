import React, { createContext, useState } from "react";

export const OrganizationContext = createContext();

export const OrganizationProvider = ({ children }) => {
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(() => {
    return localStorage.getItem("selectedOrganizationId") || null;
  });

  return (
    <OrganizationContext.Provider
      value={{ selectedOrganizationId, setSelectedOrganizationId }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};
