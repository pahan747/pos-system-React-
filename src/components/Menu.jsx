import React, { useState } from 'react'
import MenuCategories from './MenuCategories';
import MenuItems from './MenuItems';

const Menu = ({ searchTerm }) => {
  const [selectedCategory, setSelectedCategory] = useState("all");

  return (
    <div>
      <MenuCategories onCategoryChange={setSelectedCategory} selectedCategory={selectedCategory} />
      <MenuItems selectedCategory={selectedCategory} searchTerm={searchTerm} />
    </div>
  )
}

export default Menu