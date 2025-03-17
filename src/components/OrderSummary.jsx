import React, { useContext, useEffect, useState, useCallback } from "react";
import { OrganizationContext } from "../context/OrganizationContext";
import { AuthContext } from "../context/AuthContext";
import { TableContext } from "../context/TableContext";
import { useCart } from "../context/CartContext";
import axios from "axios";
import "../assets/css/components/OrderSummary.css";
import { Button, Input, Col, message } from "antd";
import ReceiptDetails from "./ReceiptDetails";
import PaymentKeypad from "./PaymentKeypad";
import CardTypeSelector from "./CardTypeSelector";
import PaymentModal from "./PaymentModal";
import { Typography } from "antd";

const { Title, Text } = Typography;

const OrderSummary = ({ selectedTable }) => {
  const { selectedOrganizationId } = useContext(OrganizationContext);
  const { selectedTableId } = useContext(TableContext);
  const { accessToken } = useContext(AuthContext);
  const { cartData, setCartData, cartLoading, setCartLoading, cartError, setCartError } = useCart();
  const BASE_URL = process.env.REACT_APP_API_URL;
  const tableName = selectedTable ? selectedTable.name : "No table selected";
  const tableId = selectedTable ? selectedTable.id : selectedTableId;
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [amountEntered, setAmountEntered] = useState("0.00");
  const [discount, setDiscount] = useState("0");
  const [selectedCardType, setSelectedCardType] = useState(null);

  const fetchCartDetails = useCallback(async () => {
    if (!tableId || !selectedOrganizationId || !accessToken) {
      setCartData(null);
      return;
    }
    
    setCartLoading(true);
    setCartError(null);
    
    try {
      const response = await axios.get(
        `${BASE_URL}Cart/get-cart-details?Guid=${tableId}&OrganizationsId=${selectedOrganizationId}`,
        { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
      );
      
      setCartData({
        ...response.data,
        cartDetails: response.data.cartDetails.map((item) => ({ ...item })),
      });
    } catch (err) {
      setCartError("Failed to fetch cart details");
      console.error(err);
    } finally {
      setCartLoading(false);
    }
  }, [tableId, selectedOrganizationId, accessToken, BASE_URL, setCartData, setCartLoading, setCartError]);

  useEffect(() => {
    let isMounted = true;
    
    const loadCartDetails = async () => {
      if (!isMounted) return;
      await fetchCartDetails();
    };
    
    loadCartDetails();
    
    return () => {
      isMounted = false;
    };
  }, [fetchCartDetails]);

  // Handle note input change (local state only)
  const handleNoteInputChange = (index, value) => {
    const item = cartData.cartDetails[index];
    if (item.isKot !== 0) return; // Only allow editing if isKot is 0
    
    setCartData((prev) => {
      const newCartDetails = [...prev.cartDetails];
      newCartDetails[index].note = value;
      return { ...prev, cartDetails: newCartDetails };
    });
  };

  // Handle quantity increase
  const handleQuantityIncrease = (index) => {
    const item = cartData.cartDetails[index];
    if (item.isKot !== 0) return; // Only allow increase if isKot is 0

    setCartData((prev) => {
      const newCartDetails = [...prev.cartDetails];
      newCartDetails[index].qty += 1;
      return { ...prev, cartDetails: newCartDetails };
    });
  };

  // Handle quantity decrease  
  const handleQuantityDecrease = (index) => {
    const item = cartData.cartDetails[index];
    if (item.isKot !== 0 || item.qty <= 1) return; // Only allow decrease if isKot is 0 and qty > 1

    setCartData((prev) => {
      const newCartDetails = [...prev.cartDetails];
      newCartDetails[index].qty -= 1;
      return { ...prev, cartDetails: newCartDetails };
    });
  };

  // Handle note addition to database (on button click)
  const handleAddNoteToDatabase = async (index) => {
    const item = cartData.cartDetails[index];
    if (item.isKot !== 0) return; // Only allow adding note if isKot is 0

    const noteValue = cartData.cartDetails[index].note || "";
    try {
      await axios.post(
        `${BASE_URL}Cart/add-note`,
        { cartDetailId: cartData.cartDetails[index].id, note: noteValue },
        { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
      );
      await fetchCartDetails(); // Refresh data after update
    } catch (err) {
      setCartError("Failed to add note.");
      console.error(err);
    }
  };

  const calculateDiscountedTotal = () => {
    const subTotal = parseFloat(cartData?.subTotal || "0.00");
    const discountPercentage = parseFloat(discount || "0") / 100;
    return (subTotal - subTotal * discountPercentage).toFixed(2);
  };

  const calculateBalance = () => (parseFloat(amountEntered || "0.00") - parseFloat(calculateDiscountedTotal())).toFixed(2);

  const handlePlaceOrder = async () => {
    if (!tableId || !selectedOrganizationId || !accessToken) {
      message.error("Missing required information");
      return;
    }

    if (!cartData?.cartDetails?.length) {
      message.warning("No items in cart to place order");
      return;
    }

    try {
      await axios.post(
        `${BASE_URL}Cart/place-order?TableId=${tableId}`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
      );
      
      // Refresh cart details after placing order
      await fetchCartDetails();
      message.success("Order placed successfully!");
      
    } catch (err) {
      message.error("Failed to place order");
      console.error(err);
    }
  };

  const handleFinishOrder = () => {
    if (!selectedPayment) {
      message.warning("Please select a payment method");
      return;
    }

    if (!cartData?.cartDetails?.length) {
      message.warning("No items in cart to finish order");
      return;
    }

    if (selectedPayment === "Cash") setShowCashModal(true);
    else if (selectedPayment === "Card") setShowCardModal(true);
    else if (selectedPayment === "QR") setShowQRModal(true);
  };

  const handlePaymentConfirm = async (method) => {
    try {
      const paymentTypeMap = { Cash: 0, Card: 1, QR: 2 };
      const details = cartData.cartDetails
        .filter((item) => item.qty > 0 && item.price > 0)
        .map((item) => ({
          productId: item.productId || "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          qty: item.qty || 0,
          price: item.price || 0,
          amount: (item.qty || 0) * (item.price || 0),
          status: 0,
          spicy: ""
        }));

      const subTotal = parseFloat(cartData?.subTotal || "0.00");
      const discountAmount = subTotal * (parseFloat(discount || "0") / 100);
      const total = (
        subTotal +
        parseFloat(cartData?.tax || "0.00") +
        parseFloat(cartData?.service || "0.00") -
        discountAmount
      ).toFixed(2);

      const orderData = {
        invoiceNumber: `INV-${Date.now()}`,
        tableId: tableId || "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        type: 0,
        paymentType: paymentTypeMap[method],
        status: 0,
        dueDate: new Date().toISOString(),
        userId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        noOfItems: details.length,
        total: parseFloat(total),
        discount: parseFloat(discount || "0"),
        tax: parseFloat(cartData?.tax || "0.00"),
        subTotal: subTotal,
        serviceCharge: parseFloat(cartData?.service || "0.00"),
        paidAmount: parseFloat(amountEntered),
        customerID: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        organizationId: selectedOrganizationId,
        details: details
      };

      const response = await axios.post(`${BASE_URL}Invoice/create-invoice-new`, orderData, {
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });

      if (response.status === 200 || response.status === 201) {
        message.success(`Payment successful via ${method}!`);
        setCartData(null);
        setShowCashModal(false);
        setShowCardModal(false);
        setShowQRModal(false);
        setAmountEntered("0.00");
        setDiscount("0");
        setSelectedCardType(null);
        setSelectedPayment(null);
      } else {
        throw new Error("Payment failed");
      }
    } catch (err) {
      console.error("Payment error details:", {
        response: err.response?.data,
        status: err.response?.status,
        message: err.message
      });
      message.error("Failed to process payment. Please try again.");
    }
  };

  const handleKeypadClick = (value) => {
    if (value === "C") {
      setAmountEntered("0.00");
    } else if (value === "OK") {
      if (parseFloat(amountEntered) >= parseFloat(calculateDiscountedTotal())) {
        handlePaymentConfirm(selectedPayment);
      }
    } else {
      const currentAmount = amountEntered === "0.00" ? "" : amountEntered.replace(".00", "");
      const newValue = currentAmount + value;
      setAmountEntered(newValue + ".00");
    }
  };

  return (
    <aside className="order-summary">
      <div className="table-header">
        <h2>{tableName}</h2>
        <p>Customer Section</p>
        <div className="edit-icon"><i className="fas fa-edit"></i></div>
      </div>
      <div className="service-buttons">
        {["Dine in", "Take Away", "Delivery"].map((service) => (
          <button key={service} className={`service-btn ${service === "Dine in" ? "active" : ""}`}>
            {service}
          </button>
        ))}
      </div>

      {cartLoading ? (
        <div>Loading...</div>
      ) : cartError ? (
        <div>{cartError}</div>
      ) : (
        <>
          <div className="order-items">
            {cartData?.cartDetails?.length > 0 ? (
              cartData.cartDetails.map((item, index) => (
                <div key={index} className="order-item">
                  <img src={item.image} alt={item.name} />
                  <div className="order-details">
                    <h4>{item.name}</h4>
                    <div className="order-price">
                      <span>${(item.price || 0).toFixed(2)}</span>
                      <div className="quantity-controls">
                        <button 
                          className="qty-btn decrease" 
                          disabled={item.qty <= 1 || item.isKot !== 0}
                          onClick={() => handleQuantityDecrease(index)}
                        >
                          -
                        </button>
                        <span>{item.qty}x</span>
                        <button 
                          className="qty-btn increase"
                          disabled={item.isKot !== 0}
                          onClick={() => handleQuantityIncrease(index)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="input-container">
                      <Input
                        placeholder="Add notes"
                        value={item.note || ""} 
                        onChange={(e) => handleNoteInputChange(index, e.target.value)}
                        disabled={item.isKot !== 0}
                        style={{ marginTop: "8px", width: "calc(100% - 80px)" }}
                      />
                      <button
                        className="add-note-btn"
                        onClick={() => handleAddNoteToDatabase(index)}
                        disabled={item.isKot !== 0}
                      >
                        Add
                      </button>
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
              <p>SubTotal: <span>${(cartData.subTotal || 0).toFixed(2)}</span></p>
              <p>Tax: <span>${(cartData.tax || 0).toFixed(2)}</span></p>
              <p>Service: <span>${(cartData.service || 0).toFixed(2)}</span></p>
              {(cartData.discount || 0) > 0 && (
                <p>Discount: <span>-${(cartData.discount || 0).toFixed(2)}</span></p>
              )}
              <h3>Total: <span>${(cartData.subTotal || 0).toFixed(2)}</span></h3>
            </div>
          )}
        </>
      )}

      <div className="payment-options">
        {["Cash", "Card", "QR"].map((method) => (
          <button
            key={method}
            className={`payment-btn ${selectedPayment === method ? "active" : ""}`}
            onClick={() => setSelectedPayment(method)}
          >
            <i
              className={`fas fa-${
                method === "Cash" ? "money-bill-wave" : method === "Card" ? "credit-card" : "qrcode"
              }`}
            ></i>{" "}
            {method === "Card" ? "Credit/Debit Card" : method}
          </button>
        ))}
      </div>

      <button className="place-order-btn" onClick={handlePlaceOrder}>
        Place Order
      </button>

      <button
        className="finish-order-btn"
        onClick={handleFinishOrder}
      >
        Finish Order
      </button>

      {/* Cash Payment Modal */}
      <PaymentModal
        title="Cash Payment"
        visible={showCashModal}
        onCancel={() => {
          setShowCashModal(false);
          setAmountEntered("0.00");
          setDiscount("0");
        }}
        footer={null}
      >
        <Col span={12}>
          <ReceiptDetails
            cartData={cartData}
            discount={discount}
            setDiscount={setDiscount}
            amountEntered={amountEntered}
            calculateDiscountedTotal={calculateDiscountedTotal}
            calculateBalance={calculateBalance}
          />
        </Col>
        <Col span={12}>
          <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)" }}>
            <PaymentKeypad handleKeypadClick={handleKeypadClick} />
            <Button
              type="primary"
              style={{
                width: "100%",
                height: "50px",
                marginTop: "20px",
                background: "#52c41a",
                borderColor: "#52c41a",
                borderRadius: "6px",
                fontSize: "16px",
                fontWeight: "bold",
              }}
              onClick={() => handlePaymentConfirm("Cash")}
              disabled={parseFloat(amountEntered) < parseFloat(calculateDiscountedTotal())}
            >
              Pay Now
            </Button>
          </div>
        </Col>
      </PaymentModal>

      {/* Card Payment Modal */}
      <PaymentModal
        title="Credit/Debit Card Payment"
        visible={showCardModal}
        onCancel={() => {
          setShowCardModal(false);
          setAmountEntered("0.00");
          setSelectedCardType(null);
        }}
        footer={null}
      >
        <Col span={12}>
          <ReceiptDetails
            cartData={cartData}
            discount={discount}
            setDiscount={setDiscount}
            amountEntered={amountEntered}
            calculateDiscountedTotal={calculateDiscountedTotal}
            calculateBalance={calculateBalance}
          />
        </Col>
        <Col span={12}>
          <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)" }}>
            <Title level={4} style={{ color: "#52c41a", marginBottom: "16px" }}>
              Select Card Type
            </Title>
            <CardTypeSelector selectedCardType={selectedCardType} setSelectedCardType={setSelectedCardType} />
            <Button
              type="primary"
              style={{
                width: "100%",
                height: "50px",
                marginTop: "20px",
                background: "#52c41a",
                borderColor: "#52c41a",
                borderRadius: "6px",
                fontSize: "16px",
                fontWeight: "bold",
              }}
              onClick={() => handlePaymentConfirm("Card")}
              disabled={parseFloat(amountEntered) < parseFloat(calculateDiscountedTotal()) || !selectedCardType}
            >
              Confirm Payment
            </Button>
          </div>
        </Col>
      </PaymentModal>

      {/* QR Payment Modal */}
      <PaymentModal
        title="QR Code Payment"
        visible={showQRModal}
        onCancel={() => {
          setShowQRModal(false);
          setAmountEntered("0.00");
        }}
        footer={null}
      >
        <Col span={12}>
          <ReceiptDetails
            cartData={cartData}
            discount={discount}
            setDiscount={setDiscount}
            amountEntered={amountEntered}
            calculateDiscountedTotal={calculateDiscountedTotal}
            calculateBalance={calculateBalance}
          />
        </Col>
        <Col span={12}>
          <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)" }}>
            <Title level={4} style={{ color: "#52c41a", marginBottom: "16px" }}>
              Scan QR Code
            </Title>
            <div
              style={{
                width: "100%",
                height: "200px",
                border: "1px dashed #d9d9d9",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: "20px",
                backgroundColor: "#f0f0f0",
                borderRadius: "4px",
              }}
            >
              <Text>QR Code Placeholder</Text>
            </div>
            <Button
              type="primary"
              style={{
                width: "100%",
                height: "50px",
                background: "#52c41a",
                borderColor: "#52c41a",
                borderRadius: "6px",
                fontSize: "16px",
                fontWeight: "bold",
              }}
              onClick={() => handlePaymentConfirm("QR")}
              disabled={parseFloat(amountEntered) < parseFloat(calculateDiscountedTotal())}
            >
              Confirm Payment
            </Button>
          </div>
        </Col>
      </PaymentModal>
    </aside>
  );
};

export default OrderSummary;