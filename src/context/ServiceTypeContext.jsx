import React, { createContext, useState, useContext } from 'react';

export const ServiceTypeContext = createContext();

export const ServiceTypeProvider = ({ children }) => {
  const [selectedServiceType, setSelectedServiceType] = useState('Dine in');

  return (
    <ServiceTypeContext.Provider value={{ selectedServiceType, setSelectedServiceType }}>
      {children}
    </ServiceTypeContext.Provider>
  );
};

export const useServiceType = () => {
  const context = useContext(ServiceTypeContext);
  if (!context) {
    throw new Error('useServiceType must be used within a ServiceTypeProvider');
  }
  return context;
}; 