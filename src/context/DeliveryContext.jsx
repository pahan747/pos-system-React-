import React, { createContext, useState, useContext } from 'react';

export const DeliveryContext = createContext();

export const DeliveryProvider = ({ children }) => {
  const [deliveryOrderCounter, setDeliveryOrderCounter] = useState(0);
  const [deliveryOrderNumber, setDeliveryOrderNumber] = useState(`DL-${deliveryOrderCounter}`);
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [activeDeliveryOrder, setActiveDeliveryOrder] = useState(null);
  const [deliveryCartDetails, setDeliveryCartDetails] = useState(null);
  const [deliveryServiceType, setDeliveryServiceType] = useState(null);

  const generateNextDeliveryOrderNumber = () => {
    const nextCounter = deliveryOrderCounter + 1;
    setDeliveryOrderCounter(nextCounter);
    const newOrderNumber = `DL-${nextCounter}`;
    setDeliveryOrderNumber(newOrderNumber);
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

  const addDeliveryOrder = () => {
    const orderNumber = generateNextDeliveryOrderNumber();
    const uniqueGuid = generateUniqueGuid();
    
    const newOrder = {
      id: uniqueGuid,
      tableId: orderNumber,
      name: orderNumber,
      items: 0,
      status: "Open",
      guid: uniqueGuid
    };
    
    setDeliveryOrders([...deliveryOrders, newOrder]);
    return newOrder;
  };

  const handleDeliveryOrderSelect = (order) => {
    console.log("Selecting Delivery order:", order.id);
    setDeliveryServiceType('Delivery');
    setActiveDeliveryOrder(order);
    setDeliveryCartDetails(null);
  };

  const updateDeliveryCartDetails = (details) => {
    setDeliveryCartDetails(details);
  };

  const clearActiveDeliveryOrder = () => {
    console.log("Clearing active delivery order and cart details");
    setActiveDeliveryOrder(null);
    setDeliveryCartDetails(null);
    setDeliveryServiceType(null);
  };

  const switchDeliveryServiceType = (serviceType) => {
    console.log("Delivery context: switching to", serviceType);
    
    if (serviceType !== 'Delivery') {
      // Clear all Delivery specific data
      clearActiveDeliveryOrder();
    }
    
    setDeliveryServiceType(serviceType);
  };

  return (
    <DeliveryContext.Provider value={{ 
      deliveryOrderNumber, 
      setDeliveryOrderNumber,
      generateNextDeliveryOrderNumber,
      deliveryOrders,
      setDeliveryOrders,
      addDeliveryOrder,
      activeDeliveryOrder,
      handleDeliveryOrderSelect,
      deliveryCartDetails,
      updateDeliveryCartDetails,
      clearActiveDeliveryOrder,
      deliveryServiceType,
      switchDeliveryServiceType
    }}>
      {children}
    </DeliveryContext.Provider>
  );
};

export const useDelivery = () => {
  const context = useContext(DeliveryContext);
  if (!context) {
    throw new Error('useDelivery must be used within a DeliveryProvider');
  }
  return context;
};