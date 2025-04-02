// src/components/Menu.js
import React, { useState } from "react";
import MenuCategories from "./MenuCategories";
import MenuItems from "./MenuItems";

const Menu = ({ searchTerm, refetchTables }) => {
  const [selectedCategory, setSelectedCategory] = useState("all");

  return (
    <div>
      <MenuCategories
        onCategoryChange={setSelectedCategory}
        selectedCategory={selectedCategory}
      />
      <MenuItems
        selectedCategory={selectedCategory}
        searchTerm={searchTerm}
        refetchTables={refetchTables}
      />
    </div>
  );
};

export default Menu;