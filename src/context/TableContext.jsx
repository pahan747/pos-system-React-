import React, { createContext, useState } from "react";

export const TableContext = createContext();

export const TableProvider = ({ children }) => {
  const [selectedTableId, setSelectedTableId] = useState(null); 

  return (
    <TableContext.Provider value={{ selectedTableId, setSelectedTableId }}>
      {children}
    </TableContext.Provider>
  );
};