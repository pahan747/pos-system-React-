import React, { createContext, useState, useContext } from 'react';

export const TakeAwayContext = createContext();

export const TakeAwayProvider = ({ children }) => {
  const [orderCounter, setOrderCounter] = useState(0);
  const [takeAwayOrderNumber, setTakeAwayOrderNumber] = useState(`TA-${orderCounter}`);
  const [takeAwayOrders, setTakeAwayOrders] = useState([]);
  const [activeTakeAwayOrder, setActiveTakeAwayOrder] = useState(null);
  const [cartDetails, setCartDetails] = useState(null);

  const generateNextOrderNumber = () => {
    const nextCounter = orderCounter + 1;
    setOrderCounter(nextCounter);
    const newOrderNumber = `TA-${nextCounter}`;
    setTakeAwayOrderNumber(newOrderNumber);
    return newOrderNumber;
  };

  const generateUniqueGuid = () => {
    // Generate a UUID v4 format
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const addTakeAwayOrder = () => {
    const orderNumber = generateNextOrderNumber();
    const uniqueGuid = generateUniqueGuid();
    
    const newOrder = {
      id: uniqueGuid,
      tableId: orderNumber,
      name: orderNumber,
      items: 0,
      status: "Open",
      guid: uniqueGuid
    };
    
    setTakeAwayOrders([...takeAwayOrders, newOrder]);
    return newOrder;
  };

  const handleTakeAwayOrderSelect = (order) => {
    setActiveTakeAwayOrder(order);
    // Clear cart details when selecting a new order
    setCartDetails(null);
  };

  const updateCartDetails = (details) => {
    setCartDetails(details);
  };

  const clearActiveOrder = () => {
    setActiveTakeAwayOrder(null);
    setCartDetails(null);
  };

  return (
    <TakeAwayContext.Provider value={{ 
      takeAwayOrderNumber, 
      setTakeAwayOrderNumber,
      generateNextOrderNumber,
      takeAwayOrders,
      setTakeAwayOrders,
      addTakeAwayOrder,
      activeTakeAwayOrder,
      handleTakeAwayOrderSelect,
      cartDetails,
      updateCartDetails,
      clearActiveOrder
    }}>
      {children}
    </TakeAwayContext.Provider>
  );
};

export const useTakeAway = () => {
  const context = useContext(TakeAwayContext);
  if (!context) {
    throw new Error('useTakeAway must be used within a TakeAwayProvider');
  }
  return context;
}; 