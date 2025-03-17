import React, { createContext, useState, useEffect } from "react";

export const OrganizationContext = createContext();

export const OrganizationProvider = ({ children }) => {
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(() => {
    return localStorage.getItem("selectedOrganizationId") || null;
  });

  // Only update localStorage when selectedOrganizationId changes
  useEffect(() => {
    if (selectedOrganizationId) {
      localStorage.setItem("selectedOrganizationId", selectedOrganizationId);
    }
  }, [selectedOrganizationId]);

  return (
    <OrganizationContext.Provider
      value={{ selectedOrganizationId, setSelectedOrganizationId }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};
