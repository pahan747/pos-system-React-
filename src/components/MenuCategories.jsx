import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import "../assets/css/components/MenuCategories.css";
import { FaList } from "react-icons/fa";
import { GiWaterDrop } from "react-icons/gi";

const MenuCategories = ({ onCategoryChange, selectedCategory }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { accessToken } = useContext(AuthContext);
  const BASE_URL = process.env.REACT_APP_API_URL;
  console.log("API URL:", BASE_URL);

  const organizationId = "1e7071f0-dacb-4a98-f264-08dcb066d923";

  useEffect(() => {

    const fetchCategories = async () => {
      try {
        if (!accessToken)
          throw new Error("Access token missing. Please log in.");
        const config = {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        };
        const response = await axios.get(
          `${BASE_URL}Product/get-category?Organization=${organizationId}`,
          config
        );
        console.log("Categories from API:", response.data); // Debugging

        // Ensure the first category is "All"
        const allCategory = { id: "all", name: "All" }; // Static "All" category
        const apiCategories = response.data; // Categories from API

        // Check if "All" already exists in the API response
        const hasAllCategory = apiCategories.some((cat) => cat.name === "All");

        // If "All" doesn't exist, prepend it to the list
        const updatedCategories = hasAllCategory
          ? apiCategories // Keep API data as-is if "All" exists
          : [allCategory, ...apiCategories]; // Prepend "All" if it doesn't exist

        setCategories(updatedCategories);
        setLoading(false);
      } catch (err) {
        setError("Failed to load categories");
        setLoading(false);
      }
    };
    fetchCategories();
  }, [organizationId]);

  if (loading) return <p>Loading categories...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="menu-categories-wrapper">
      <div className="menu-categories">
        {categories.map((category, index) => {
          // Determine which icon to display
          const Icon = category.name === "All" ? FaList : GiWaterDrop;
          return (
            <div
              key={index}
              className={`category ${
                selectedCategory === category.id ? "active" : ""
              }`}
              onClick={() => onCategoryChange(category.id)}
            >
              <div className="category-icon">
                <Icon />
              </div>
              <p>{category.name}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MenuCategories;
