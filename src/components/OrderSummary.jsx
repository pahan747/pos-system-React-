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
import { useServiceType } from '../context/ServiceTypeContext';

const { Title, Text } = Typography;

const OrderSummary = ({ selectedTable }) => {
  const { selectedOrganizationId } = useContext(OrganizationContext);
  const { selectedTableId } = useContext(TableContext);
  const { accessToken } = useContext(AuthContext);
  const { cartData, setCartData, cartLoading, setCartLoading, cartError, setCartError } = useCart();
  const { selectedServiceType, setSelectedServiceType } = useServiceType();
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [orderNumber, setOrderNumber] = useState(generateOrderNumber());

  function generateOrderNumber() {
    const prefix = 'TO-';
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${randomNum}`;
  }

  const fetchCartDetails = useCallback(async () => {
    if (!selectedOrganizationId || !accessToken) {
      setCartData(null);
      return;
    }

    setCartLoading(true);
    setCartError(null);

    try {
      let endpoint;
      // Clear existing cart data before fetching new data
      setCartData(null);

      switch (selectedServiceType) {
        case "Take Away":
          endpoint = `${BASE_URL}Cart/get-takeaway-cart-details?OrganizationsId=${selectedOrganizationId}`;
          break;
        case "Delivery":
          endpoint = `${BASE_URL}Cart/get-delivery-cart-details?OrganizationsId=${selectedOrganizationId}`;
          break;
        case "Dine in":
          if (!tableId) {
            setCartError("Please select a table for dine-in orders");
            setCartLoading(false);
            return;
          }
          endpoint = `${BASE_URL}Cart/get-cart-details?Guid=${tableId}&OrganizationsId=${selectedOrganizationId}`;
          break;
        default:
          setCartError("Invalid service type");
          setCartLoading(false);
          return;
      }

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });

      // Validate the response data
      if (!response.data || !response.data.cartDetails) {
        setCartError("Invalid cart data received");
        return;
      }

      // Add service type to cart data for validation
      setCartData({
        ...response.data,
        serviceType: selectedServiceType
      });
    } catch (err) {
      console.error("Fetch Error:", err);
      setCartError("Failed to fetch cart details");
      setCartData(null);
    } finally {
      setCartLoading(false);
    }
  }, [selectedServiceType, tableId, selectedOrganizationId, accessToken, BASE_URL, setCartData, setCartLoading, setCartError]);

  useEffect(() => {
    const initializeCart = async () => {
      setIsTransitioning(true);
      setCartData(null);
      setCartError(null);
      await fetchCartDetails();
      setIsTransitioning(false);
    };

    initializeCart();
  }, [selectedServiceType, tableId, fetchCartDetails]);

  const handleServiceTypeChange = (service) => {
    if (service === selectedServiceType) return; // Prevent unnecessary reloads

    setIsTransitioning(true);
    setSelectedServiceType(service);
    setCartData(null); // Clear existing cart data
    setCartError(null);
    
    if (service !== 'Dine in') {
      setOrderNumber(generateOrderNumber());
    }
  };

  const handleNoteInputChange = (index, value) => {
    if (!cartData?.cartDetails?.[index] || cartData.cartDetails[index].isKot !== 0) return;

    setCartData((prev) => {
      const newCartDetails = [...prev.cartDetails];
      newCartDetails[index].note = value;
      return { ...prev, cartDetails: newCartDetails };
    });
  };

  const handleQuantityIncrease = (index) => {
    if (!cartData?.cartDetails?.[index] || cartData.cartDetails[index].isKot !== 0) return;

    setCartData((prev) => {
      const newCartDetails = [...prev.cartDetails];
      newCartDetails[index].qty += 1;
      return { ...prev, cartDetails: newCartDetails };
    });
  };

  const handleQuantityDecrease = (index) => {
    if (!cartData?.cartDetails?.[index] || 
        cartData.cartDetails[index].isKot !== 0 || 
        cartData.cartDetails[index].qty <= 1) return;

    setCartData((prev) => {
      const newCartDetails = [...prev.cartDetails];
      newCartDetails[index].qty -= 1;
      return { ...prev, cartDetails: newCartDetails };
    });
  };

  const handleAddNoteToDatabase = async (index) => {
    if (!cartData?.cartDetails?.[index] || cartData.cartDetails[index].isKot !== 0) return;

    const noteValue = cartData.cartDetails[index].note || "";
    try {
      await axios.post(
        `${BASE_URL}Cart/add-note`,
        { cartDetailId: cartData.cartDetails[index].id, note: noteValue },
        { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
      );
      await fetchCartDetails();
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

    if (!cartData?.cartDetails.length) {
      message.warning("No items in cart to place order");
      return;
    }

    try {
      await axios.post(
        `${BASE_URL}Cart/place-order?TableId=${tableId}`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
      );
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

    if (!cartData?.cartDetails.length) {
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
          spicy: "",
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
        type: ["Dine in", "Take Away", "Delivery"].indexOf(selectedServiceType),
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
        details: details,
      };

      const response = await axios.post(`${BASE_URL}Invoice/create-invoice-new`, orderData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200 || response.status === 201) {
        message.success(`Payment successful via ${method}!`);
        setCartData(null);
        setCartError(null);
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
        message: err.message,
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

  const renderOrderContent = () => {
    if (cartLoading || isTransitioning) {
      return (
        <div className="order-content-loading">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
          </div>
          <div className="loading-text">
            <p>Loading cart items...</p>
            <p className="sub-text">Please wait while we fetch your order details</p>
          </div>
        </div>
      );
    }

    if (cartError) {
      return (
        <div className="order-content-error">
          <div className="error-icon">
            <i className="fas fa-exclamation-circle"></i>
          </div>
          <div className="error-text">
            <p>Something went wrong</p>
            <p className="sub-text">{cartError}</p>
          </div>
        </div>
      );
    }

    // Validate that cart data matches current service type
    if (cartData?.serviceType !== selectedServiceType) {
      setCartData(null);
      fetchCartDetails();
      return (
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Updating cart items...</p>
        </div>
      );
    }

    if (!cartData?.cartDetails?.length) {
      return (
        <div className="no-items-state">
          <i className="fas fa-shopping-cart"></i>
          <p>No items in cart for {selectedServiceType}</p>
          <p className="sub-text">Add items to get started</p>
        </div>
      );
    }

    return cartData.cartDetails.map((item, index) => (
      <div key={item.id || index} className="order-item">
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
    ));
  };

  const renderHeader = () => {
    switch (selectedServiceType) {
      case 'Dine in':
        return (
          <div className="table-header">
            <h2>{tableName}</h2>
            <p>Table Section</p>
            <div className="edit-icon"><i className="fas fa-edit"></i></div>
          </div>
        );
      case 'Take Away':
      case 'Delivery':
        return (
          <div className="table-header">
            <h2>{orderNumber}</h2>
            <p>{selectedServiceType === 'Take Away' ? 'Order Section' : 'Delivery Section'}</p>
            <div className="edit-icon">
              <i className={`fas fa-${selectedServiceType === 'Take Away' ? 'shopping-bag' : 'motorcycle'}`}></i>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <aside className="order-summary">
      {renderHeader()}
      <div className="service-buttons">
        {["Dine in", "Take Away", "Delivery"].map((service) => (
          <button
            key={service}
            className={`service-btn ${selectedServiceType === service ? "active" : ""}`}
            onClick={() => handleServiceTypeChange(service)}
          >
            {service}
          </button>
        ))}
      </div>

      <div className={`order-items ${isTransitioning ? 'transitioning' : ''}`}>
        {renderOrderContent()}
      </div>

      {cartData && !cartLoading && cartData.cartDetails.length > 0 && (
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

      <button className="finish-order-btn" onClick={handleFinishOrder}>
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