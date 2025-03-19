import React, { useContext, useEffect, useState, useCallback, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { TableContext } from "../context/TableContext";
import { useCart } from "../context/CartContext";
import { useServiceType } from '../context/ServiceTypeContext';
import PropTypes from 'prop-types';

const SERVICE_TYPE_MAP = {
  "Dine in": 0,
  "Take Away": 1,
  "Delivery": 2,
};

const ORGANIZATION_ID = "1e7071f0-dacb-4a98-f264-08dcb066d923";
const CUSTOMER_ID = "80ebf3b0-a2d7-49d2-6a06-08dcda15281e";

const MenuItems = ({ selectedCategory, searchTerm, refetchTables }) => {
  // State management
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingState, setLoadingState] = useState({});
  const [dishError, setDishError] = useState(null);

  // Context hooks
  const { accessToken } = useContext(AuthContext);
  const { selectedTableId } = useContext(TableContext);
  const { setCartData, setCartLoading, setCartError } = useCart();
  const { selectedServiceType } = useServiceType();
  
  const BASE_URL = process.env.REACT_APP_API_URL;

  // API configuration
  const getApiConfig = useCallback(() => ({
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    }
  }), [accessToken]);

  // Fetch menu items
  const fetchMenuItems = useCallback(async () => {
    try {
      if (!accessToken) {
        throw new Error("Access token missing. Please log in.");
      }

      const response = await axios.get(
        `${BASE_URL}Product/get-productlist?Organization=${ORGANIZATION_ID}`,
        getApiConfig()
      );

      setItems(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to load menu items");
      console.error("Error fetching menu items:", err);
    } finally {
      setLoading(false);
    }
  }, [BASE_URL, accessToken, getApiConfig]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  // Cart operations
  const fetchCartDetails = useCallback(async () => {
    if (!selectedTableId || !accessToken) return;

    setCartLoading(true);
    setCartError(null);

    try {
      const response = await axios.get(
        `${BASE_URL}Cart/get-cart-details?Guid=${selectedTableId}&OrganizationsId=${ORGANIZATION_ID}`,
        getApiConfig()
      );

      setCartData(response.data);
    } catch (err) {
      setCartError("Failed to fetch cart details");
      console.error("Error fetching cart:", err);
    } finally {
      setCartLoading(false);
    }
  }, [selectedTableId, accessToken, BASE_URL, setCartData, setCartLoading, setCartError, getApiConfig]);

  const addToDineInCart = async (product, orderType) => {
    if (!selectedTableId) {
      throw new Error("Please select a table for dine-in orders");
    }

    const params = {
      Guid: selectedTableId,
      ProductId: product.id,
      Qty: 1,
      cusId: CUSTOMER_ID,
      name: product.name,
      value: product.price,
      ordertype: orderType,
      OrganizationsId: ORGANIZATION_ID
    };

    return axios.post(`${BASE_URL}Cart/add-to-cart`, null, {
      params,
      ...getApiConfig()
    });
  };

  const addToTakeawayCart = async (product, orderType) => {
    const params = {
      ProductId: product.id,
      Qty: 1,
      cusId: CUSTOMER_ID,
      name: product.name,
      value: product.price,
      ordertype: orderType,
      OrganizationsId: ORGANIZATION_ID
    };

    return axios.post(`${BASE_URL}Cart/add-to-cart`, null, {
      params,
      ...getApiConfig()
    });
  };

  const handleAddToCart = async (product) => {
    const orderType = SERVICE_TYPE_MAP[selectedServiceType] ?? 0;

    try {
      setLoadingState((prev) => ({ ...prev, [product.id]: true }));
      setDishError(null);

      if (!accessToken) {
        throw new Error("Access token missing. Please log in.");
      }

      const addToCartFn = selectedServiceType === "Dine in" 
        ? addToDineInCart 
        : addToTakeawayCart;

      await addToCartFn(product, orderType);

      // Refresh data
      if (selectedServiceType === "Dine in") {
        await Promise.all([
          fetchCartDetails(),
          refetchTables?.()
        ]);
      } else {
        await fetchCartDetails();
      }
    } catch (err) {
      setDishError(err.message || "Failed to add item to dish");
      console.error("Error adding to dish:", err);
    } finally {
      setLoadingState((prev) => ({ ...prev, [product.id]: false }));
    }
  };

  // Memoized filtered items
  const filteredItems = useMemo(() => {
    const searchTermLower = searchTerm?.toLowerCase() ?? "";
    return items.filter((item) => 
      (selectedCategory === "all" || item.categoryId === selectedCategory) &&
      item.name.toLowerCase().includes(searchTermLower)
    );
  }, [items, selectedCategory, searchTerm]);

  // Loading and error states
  if (loading) return <div className="loading-state">Loading menu items...</div>;
  if (error) return <div className="error-state">{error}</div>;
  if (filteredItems.length === 0) {
    return <div className="empty-state">No products available matching your criteria.</div>;
  }

  return (
    <section className="menu-items">
      {filteredItems.map((item) => (
        <div
          key={item.id}
          className={`menu-item ${item.discount ? "highlighted" : ""}`}
        >
          {item.discount && <div className="discount-label">{item.discount}</div>}
          <img 
            src={item.image} 
            alt={item.name} 
            className="item-image"
            loading="lazy"
          />
          <div className="item-info">
            <h4 className="item-name">{item.name}</h4>
            <div className="item-details">
              <span className="item-price">${item.price.toFixed(2)}</span>
              <span className="item-type">Veg</span>
            </div>
            <button
              className="add-to-dish-btn"
              onClick={() => handleAddToCart(item)}
              disabled={loadingState[item.id]}
            >
              {loadingState[item.id] ? "Adding..." : "Add to Dish"}
            </button>
            {dishError && <p className="error-message">{dishError}</p>}
          </div>
        </div>
      ))}
    </section>
  );
};

MenuItems.propTypes = {
  selectedCategory: PropTypes.string.isRequired,
  searchTerm: PropTypes.string,
  refetchTables: PropTypes.func
};

MenuItems.defaultProps = {
  searchTerm: "",
  refetchTables: null
};

export default React.memo(MenuItems);