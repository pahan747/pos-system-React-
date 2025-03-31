import React, { createContext, useState, useContext } from 'react';

export const CustomerContext = createContext();

export const CustomerProvider = ({ children }) => {
  const [selectedCustomer, setSelectedCustomer] = useState({
    id: null,
    name: ''
  });

  const updateSelectedCustomer = (id, name) => {
    setSelectedCustomer({ id, name });
  };

  return (
    <CustomerContext.Provider value={{ selectedCustomer, updateSelectedCustomer }}>
      {children}
    </CustomerContext.Provider>
  );
};

// Custom hook for using the customer context
export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
}; 