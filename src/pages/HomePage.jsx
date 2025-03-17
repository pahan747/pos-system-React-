// src/components/HomePage.js
import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Menu from "../components/Menu";
import OrganizationDropdown from "../components/OrganizationDropdown";
import { Input } from "antd";
import TableOrderManager from "../components/TableOrderManager";
import { CartProvider } from "../context/CartContext";

const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [refetchTablesFn, setRefetchTablesFn] = useState(null);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleRefetchTables = (fetchFn) => {
    setRefetchTablesFn(() => fetchFn); // Store the refetch function
  };

  return (
    <CartProvider>
      <div className="container">
        <Sidebar />
        <main className="main-content">
          <header className="header">
            <Input
              placeholder="Search Product here..."
              className="search-bar"
              style={{ width: "100%", height: 43 }}
              onChange={handleSearch}
            />
            <OrganizationDropdown />
          </header>
          <Menu searchTerm={searchTerm} refetchTables={refetchTablesFn} />
        </main>
        <TableOrderManager onRefetchTables={handleRefetchTables} />
      </div>
    </CartProvider>
  );
};

export default HomePage;