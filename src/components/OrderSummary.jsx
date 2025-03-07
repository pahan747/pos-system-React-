import React, { useContext, useEffect, useState } from "react";
import { OrganizationContext } from "../context/OrganizationContext";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { TableContext } from "../context/TableContext";
import "../assets/css/components/OrderSummary.css";

const OrderSummary = ({ selectedTable }) => {
  const { selectedOrganizationId } = useContext(OrganizationContext);
  const { selectedTableId } = useContext(TableContext);
  const { accessToken } = useContext(AuthContext);
  const [cartData, setCartData] = useState(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState(null);
  const BASE_URL = process.env.REACT_APP_API_URL;

  const tableName = selectedTable ? selectedTable.name : "No table selected";
  const tableId = selectedTable ? selectedTable.id : null;

  useEffect(() => {
    const fetchCartDetails = async () => {
      if (!tableId || !selectedOrganizationId) {
        setCartData(null);
        return;
      }

      setCartLoading(true);
      setCartError(null);

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
          `${BASE_URL}Cart/get-cart-details?Guid=${tableId}&OrganizationsId=${selectedOrganizationId}`,
          config
        );

        setCartData(response.data);
        setCartLoading(false);
      } catch (err) {
        setCartError("Failed to fetch cart details");
        setCartLoading(false);
        console.error(err);
      }
    };

    fetchCartDetails();
  }, [tableId, selectedOrganizationId]);

  const updateLocalQuantity = (itemIndex, change) => {
    setCartData(prevData => {
      if (!prevData || !prevData.cartDetails) return prevData;

      const newCartDetails = [...prevData.cartDetails];
      const currentItem = newCartDetails[itemIndex];
      const newQty = currentItem.qty + change;

      // Prevent quantity from going below 1
      if (newQty < 1) return prevData;

      // Update the item quantity
      newCartDetails[itemIndex] = {
        ...currentItem,
        qty: newQty
      };

      // Recalculate totals
      const total = newCartDetails.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const tax = prevData.tax || 0; 
      const service = prevData.service || 0; 
      const discount = prevData.discount || 0;
      const subTotal = total + tax + service - discount;

      return {
        ...prevData,
        cartDetails: newCartDetails,
        total,
        tax,
        service,
        subTotal
      };
    });
  };

  return (
    <aside className="order-summary">
      <div className="table-header">
        <h2>{tableName}</h2>
        <p>Customer Section</p>
        <div className="edit-icon">
          <i className="fas fa-edit"></i>
        </div>
      </div>
      <div className="service-buttons">
        <button className="service-btn active">Dine in</button>
        <button className="service-btn">Take Away</button>
        <button className="service-btn">Delivery</button>
      </div>

      {cartLoading ? (
        <div>Loading cart details...</div>
      ) : cartError ? (
        <div>{cartError}</div>
      ) : (
        <>
          <div className="order-items">
            {cartData &&
            cartData.cartDetails &&
            cartData.cartDetails.length > 0 ? (
              cartData.cartDetails.map((item, index) => (
                <div key={index} className="order-item">
                  <img src={item.image} alt={item.name} />
                  <div className="order-details">
                    <h4>{item.name}</h4>
                    <div className="order-price">
                      <span>${item.price.toFixed(2)}</span>
                      <div className="quantity-controls">
                        <button 
                          className="qty-btn decrease"
                          onClick={() => updateLocalQuantity(index, -1)}
                          disabled={item.qty <= 1}
                        >
                          -
                        </button>
                        <span>{item.qty}x</span>
                        <button 
                          className="qty-btn increase"
                          onClick={() => updateLocalQuantity(index, 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>No items in cart</p>
            )}
          </div>

          {cartData && (
            <div className="totals">
              <p>
                Total: <span>${cartData.total.toFixed(2)}</span>
              </p>
              <p>
                Tax: <span>${cartData.tax.toFixed(2)}</span>
              </p>
              <p>
                Service: <span>${cartData.service.toFixed(2)}</span>
              </p>
              {cartData.discount > 0 && (
                <p>
                  Discount: <span>-${cartData.discount.toFixed(2)}</span>
                </p>
              )}
              <h3>
                SubTotal: <span>${cartData.subTotal.toFixed(2)}</span>
              </h3>
            </div>
          )}
        </>
      )}

      <div className="payment-options">
        <button className="payment-btn">
          <i className="fas fa-money-bill-wave"></i> Cash
        </button>
        <button className="payment-btn">
          <i className="fas fa-credit-card"></i> Credit/Debit Card
        </button>
        <button className="payment-btn">
          <i className="fas fa-qrcode"></i> QR Code
        </button>
      </div>

      <button className="place-order-btn">Place Order</button>
      <button className="finish-order-btn">Finish Order</button>
    </aside>
  );
};

export default OrderSummary;
