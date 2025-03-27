// src/components/TableOrderManager.js
import React, { useState } from "react";
import OrderSummary from "./OrderSummary";
import BottomBar from "./BottomBar";
import OtherServicesModal from "./OtherServicesModal";

const TableOrderManager = ({ onRefetchTables }) => {
  const [selectedTable, setSelectedTable] = useState(null);
  const [refetchTablesFn, setRefetchTablesFn] = useState(null);
  const [isOtherServicesModalVisible, setIsOtherServicesModalVisible] = useState(false);

  const handleTableSelect = (table) => {
    setSelectedTable(table);
  };

  const handleRefetchTables = (fetchFn) => {
    setRefetchTablesFn(() => fetchFn);
    if (onRefetchTables) {
      onRefetchTables(fetchFn);
    }
  };

  const handleClearTable = () => {
    setSelectedTable(null);
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <OrderSummary 
          selectedTable={selectedTable} 
          refetchTables={refetchTablesFn} 
          onClearTable={handleClearTable}
        />
        <BottomBar 
          onTableSelect={handleTableSelect} 
          onRefetchTables={handleRefetchTables}
          onOtherServicesClick={() => setIsOtherServicesModalVisible(true)}
        />
        <OtherServicesModal 
          visible={isOtherServicesModalVisible}
          onClose={() => setIsOtherServicesModalVisible(false)}
        />
      </div>
    </div>
  );
};

export default TableOrderManager;