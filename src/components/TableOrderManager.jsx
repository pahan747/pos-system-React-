import React, { useState } from 'react';
import OrderSummary from './OrderSummary';
import BottomBar from './BottomBar';


const TableOrderManager = () => {
  const [selectedTable, setSelectedTable] = useState(null);

  const handleTableSelect = (table) => {
    setSelectedTable(table);
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <OrderSummary selectedTable={selectedTable} />
        <BottomBar onTableSelect={handleTableSelect} />
      </div>
    </div>
  );
};

export default TableOrderManager;