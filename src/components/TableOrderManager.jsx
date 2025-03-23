// src/components/TableOrderManager.js
import React, { useState } from "react";
import OrderSummary from "./OrderSummary";
import BottomBar from "./BottomBar";

const TableOrderManager = ({ onRefetchTables }) => {
  const [selectedTable, setSelectedTable] = useState(null);
  const [refetchTablesFn, setRefetchTablesFn] = useState(null);

  const handleTableSelect = (table) => {
    setSelectedTable(table);
  };

  const handleRefetchTables = (fetchFn) => {
    setRefetchTablesFn(() => fetchFn); // Store the fetchTables function
    if (onRefetchTables) {
      onRefetchTables(fetchFn); // Pass it up to HomePage if needed
    }
  };

  const handleClearTable = () => {
    setSelectedTable(null); // Clear the selected table
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <OrderSummary selectedTable={selectedTable} refetchTables={refetchTablesFn} onClearTable={handleClearTable} />
        <BottomBar onTableSelect={handleTableSelect} onRefetchTables={handleRefetchTables} />
      </div>
    </div>
  );
};

export default TableOrderManager;