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
  const [filteredCartDetails, setFilteredCartDetails] = useState([]);
  const [isTransitioning, setIsTransitioning] = useState(false);

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

      console.log("API Response:", response.data); // Debugging

      setCartData({
        ...response.data,
        cartDetails: response.data.cartDetails.map((item) => ({ ...item })),
      });
    } catch (err) {
      setCartError("Failed to fetch cart details");
      console.error("Fetch Error:", err);
    } finally {
      setCartLoading(false);
    }
  }, [tableId, selectedOrganizationId, accessToken, BASE_URL, setCartData, setCartLoading, setCartError]);

  const filterCartDetails = useCallback(() => {
    if (!cartData || !cartData.cartDetails) {
      setFilteredCartDetails([]);
      return;
    }

    const serviceTypeMap = {
      "Dine in": 0,
      "Take Away": 1,
      "Delivery": 2,
    };
    const selectedType = serviceTypeMap[selectedServiceType];

    // Check if cartData.type is an array or single value
    const cartTypes = Array.isArray(cartData.type) ? cartData.type : [cartData.type];
    const filtered = cartTypes.includes(selectedType) ? cartData.cartDetails : [];
    
    setFilteredCartDetails(filtered);
  }, [cartData, selectedServiceType]);

  useEffect(() => {
    let isMounted = true;

    const loadCartDetails = async () => {
      if (!isMounted) return;
      setIsTransitioning(true);
      await fetchCartDetails();
      // Add a small delay before removing transition state
      setTimeout(() => {
        if (isMounted) {
          setIsTransitioning(false);
        }
      }, 300);
    };

    loadCartDetails();

    return () => {
      isMounted = false;
    };
  }, [fetchCartDetails]);

  useEffect(() => {
    setIsTransitioning(true);
    // Add a small delay before filtering to ensure smooth transition
    const timer = setTimeout(() => {
      filterCartDetails();
      setIsTransitioning(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [cartData, selectedServiceType, filterCartDetails]);

  const handleServiceTypeChange = (service) => {
    setIsTransitioning(true);
    setSelectedServiceType(service);
    setCartError(null);
  };

  const handleNoteInputChange = (index, value) => {
    const item = filteredCartDetails[index];
    if (item.isKot !== 0) return;

    setCartData((prev) => {
      const newCartDetails = [...prev.cartDetails];
      const itemIndex = prev.cartDetails.findIndex((i) => i.id === item.id);
      newCartDetails[itemIndex].note = value;
      return { ...prev, cartDetails: newCartDetails };
    });
  };

  const handleQuantityIncrease = (index) => {
    const item = filteredCartDetails[index];
    if (item.isKot !== 0) return;

    setCartData((prev) => {
      const newCartDetails = [...prev.cartDetails];
      const itemIndex = prev.cartDetails.findIndex((i) => i.id === item.id);
      newCartDetails[itemIndex].qty += 1;
      return { ...prev, cartDetails: newCartDetails };
    });
  };

  const handleQuantityDecrease = (index) => {
    const item = filteredCartDetails[index];
    if (item.isKot !== 0 || item.qty <= 1) return;

    setCartData((prev) => {
      const newCartDetails = [...prev.cartDetails];
      const itemIndex = prev.cartDetails.findIndex((i) => i.id === item.id);
      newCartDetails[itemIndex].qty -= 1;
      return { ...prev, cartDetails: newCartDetails };
    });
  };

  const handleAddNoteToDatabase = async (index) => {
    const item = filteredCartDetails[index];
    if (item.isKot !== 0) return;

    const noteValue = item.note || "";
    try {
      await axios.post(
        `${BASE_URL}Cart/add-note`,
        { cartDetailId: item.id, note: noteValue },
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

    if (!filteredCartDetails.length) {
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

    if (!filteredCartDetails.length) {
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
      const details = filteredCartDetails
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
        setFilteredCartDetails([]);
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
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading cart items...</p>
        </div>
      );
    }

    if (cartError) {
      return (
        <div className="error-state">
          <i className="fas fa-exclamation-circle"></i>
          <p>{cartError}</p>
          <button 
            className="retry-button"
            onClick={fetchCartDetails}
          >
            <i className="fas fa-redo"></i> Retry
          </button>
        </div>
      );
    }

    if (!cartData) {
      return (
        <div className="no-items-state">
          <i className="fas fa-shopping-cart"></i>
          <p>No cart data available</p>
          <p className="sub-text">Please select a table to view orders</p>
        </div>
      );
    }

    if (filteredCartDetails.length === 0) {
      return (
        <div className="no-items-state">
          <i className="fas fa-shopping-cart"></i>
          <p>No items in cart for {selectedServiceType}</p>
          <p className="sub-text">Add items to get started</p>
        </div>
      );
    }

    return filteredCartDetails.map((item, index) => (
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

  return (
    <aside className="order-summary">
      <div className="table-header">
        <h2>{tableName}</h2>
        <p>Customer Section</p>
        <div className="edit-icon"><i className="fas fa-edit"></i></div>
      </div>
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

      {cartData && !cartLoading && filteredCartDetails.length > 0 && (
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