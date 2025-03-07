import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Menu from '../components/Menu';
import OrganizationDropdown from '../components/OrganizationDropdown';
import { Input } from 'antd';
import TableOrderManager from '../components/TableOrderManager';

const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  return (
    <div className="container">
      <Sidebar />
      <main className="main-content">
        <header className="header">
          <Input 
            placeholder="Search Product here..." 
            className="search-bar"
            style={{width: '100%', height: 43}}
            onChange={handleSearch}
          />
          <OrganizationDropdown />
        </header>
        <Menu searchTerm={searchTerm} />
      </main>
      <TableOrderManager />
    </div>
  );
};

export default HomePage;
