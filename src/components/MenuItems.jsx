import React, { useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { TableContext } from "../context/TableContext";
import { useCart } from "../context/CartContext";

const MenuItems = ({ selectedCategory, searchTerm, refetchTables }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingState, setLoadingState] = useState({});
  const [dishError, setDishError] = useState(null);
  const { accessToken } = useContext(AuthContext);
  const { selectedTableId } = useContext(TableContext);
  const { setCartData, setCartLoading, setCartError } = useCart();
  const BASE_URL = process.env.REACT_APP_API_URL;
  const organizationId = "1e7071f0-dacb-4a98-f264-08dcb066d923";

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        if (!accessToken) throw new Error("Access token missing. Please log in.");

        const config = {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        };

        const response = await axios.get(
          `${BASE_URL}Product/get-productlist?Organization=${organizationId}`,
          config
        );

        setItems(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load menu items");
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, [organizationId]);

  const fetchCartDetails = useCallback(async () => {
    if (!selectedTableId || !organizationId || !accessToken) return;

    setCartLoading(true);
    setCartError(null);

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      };

      const response = await axios.get(
        `${BASE_URL}Cart/get-cart-details?Guid=${selectedTableId}&OrganizationsId=${organizationId}`,
        config
      );

      setCartData(response.data);
      setCartLoading(false);
    } catch (err) {
      setCartError("Failed to fetch cart details");
      setCartLoading(false);
      console.error(err);
    }
  }, [selectedTableId, organizationId, accessToken, BASE_URL, setCartData, setCartLoading, setCartError]);

  const addToDish = async (product) => {
    try {
      setLoadingState((prev) => ({ ...prev, [product.id]: true }));
      setDishError(null);

      if (!accessToken) throw new Error("Access token missing. Please log in.");

      const config = {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      };

      const params = {
        Guid: selectedTableId,
        ProductId: product.id,
        Qty: 1,
        cusId: "80ebf3b0-a2d7-49d2-6a06-08dcda15281e",
        name: product.name,
        value: product.price,
        ordertype: 1,
      };

      const response = await axios.post(`${BASE_URL}Cart/add-to-cart`, null, {
        params,
        ...config,
      });

      // console.log("Item added to dish:", response.data);
      // alert("Item added to dish successfully!");

      // Refetch cart and table data
      await fetchCartDetails();
      if (refetchTables) {
        await refetchTables(); // Refetch tables to update item count
      }
    } catch (err) {
      setDishError("Failed to add item to dish");
      console.error("Error adding to dish:", err);
    } finally {
      setLoadingState((prev) => ({ ...prev, [product.id]: false }));
    }
  };

  if (loading) return <p>Loading menu items...</p>;
  if (error) return <p>{error}</p>;

  const filteredItems = items
    .filter((item) =>
      selectedCategory === "all" ? true : item.categoryId === selectedCategory
    )
    .filter((item) =>
      item.name.toLowerCase().includes(searchTerm ? searchTerm.toLowerCase() : "")
    );

  if (filteredItems.length === 0) {
    return <p>No products available matching your criteria.</p>;
  }

  return (
    <section className="menu-items">
      {filteredItems.map((item) => (
        <div
          key={item.id}
          className={`menu-item ${item.discount ? "highlighted" : ""}`}
        >
          {item.discount && <div className="discount-label">{item.discount}</div>}
          <img src={item.image} alt={item.name} className="item-image" />
          <div className="item-info">
            <h4 className="item-name">{item.name}</h4>
            <div className="item-details">
              <span className="item-price">${item.price}</span>
              <span className="item-type">Veg</span>
            </div>
            <button
              className="add-to-dish-btn"
              onClick={() => addToDish(item)}
              disabled={loadingState[item.id]}
            >
              {loadingState[item.id] ? "Adding..." : "Add to Dish"}
            </button>
            {dishError && <p className="error">{dishError}</p>}
          </div>
        </div>
      ))}
    </section>
  );
};

export default MenuItems;