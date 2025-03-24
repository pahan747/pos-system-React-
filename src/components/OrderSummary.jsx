import React, { useContext, useEffect, useState, useCallback } from "react";
import { OrganizationContext } from "../context/OrganizationContext";
import { AuthContext } from "../context/AuthContext";
import { TableContext } from "../context/TableContext";
import { useCart } from "../context/CartContext";
import { useTakeAway } from "../context/TakeAwayContext";
import axios from "axios";
import "../assets/css/components/OrderSummary.css";
import { Button, Input, Col, message } from "antd";
import ReceiptDetails from "./ReceiptDetails";
import PaymentKeypad from "./PaymentKeypad";
import CardTypeSelector from "./CardTypeSelector";
import PaymentModal from "./PaymentModal";
import { Typography } from "antd";
import { useServiceType } from "../context/ServiceTypeContext";

const { Title, Text } = Typography;

const OrderSummary = ({ selectedTable, onClearTable }) => {
  const { selectedOrganizationId } = useContext(OrganizationContext);
  const { selectedTableId, setSelectedTableId } = useContext(TableContext);
  const { accessToken } = useContext(AuthContext);
  const { cartData, setCartData, cartLoading, setCartLoading, cartError, setCartError } = useCart();
  const {
    activeTakeAwayOrder,
    cartDetails,
    updateCartDetails,
    clearActiveOrder,
    switchServiceType,
  } = useTakeAway();
  const { selectedServiceType, setSelectedServiceType } = useServiceType();
  const BASE_URL = process.env.REACT_APP_API_URL;
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
    const prefix = "TO-";
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${randomNum}`;
  }

  const getOrderDetails = () => {
    switch (selectedServiceType) {
      case "Take Away":
        return {
          id: activeTakeAwayOrder?.id,
          name: activeTakeAwayOrder?.name,
          type: "Take Away",
        };
      case "Dine in":
        return {
          id: selectedTable?.id,
          name: selectedTable?.name,
          type: "Dine in",
        };
      case "Delivery":
        return {
          id: null,
          name: orderNumber,
          type: "Delivery",
        };
      default:
        return null;
    }
  };

  const resetCartState = useCallback(() => {
    setCartData(null);
    setCartError(null);
    setCartLoading(false);
  }, [setCartData, setCartError, setCartLoading]);

  const fetchCartDetails = useCallback(
    async (skipLoading = false) => {
      if (!selectedServiceType) return;

      console.log("=== Fetching Cart Details ===");
      console.log("Service Type:", selectedServiceType);
      console.log("Table ID:", selectedTable?.id);
      console.log("Take Away Order ID:", activeTakeAwayOrder?.id);

      if (!selectedOrganizationId || !accessToken) {
        console.log("Credentials missing, aborting fetch");
        resetCartState();
        return;
      }

      if (!skipLoading) setCartLoading(true);
      setCartError(null);
      setCartData(null);

      try {
        let endpoint = "";
        let params = {};
        let shouldFetch = false;

        switch (selectedServiceType) {
          case "Dine in":
            if (!selectedTable?.id) {
              console.log("No table selected for Dine in");
              setCartData(null); // Explicitly set to null for empty state
              setCartLoading(false);
              return;
            }
            endpoint = `${BASE_URL}Cart/get-cart-details`;
            params = { 
              Guid: selectedTable.id, 
              OrganizationsId: selectedOrganizationId 
            };
            shouldFetch = true;
            break;

          case "Take Away":
            if (!activeTakeAwayOrder?.id) {
              console.log("No active Take Away order");
              setCartData({
                cartDetails: [],
                subTotal: "0.00",
                tax: "0.00",
                service: "0.00",
                serviceType: "Take Away",
              });
              setCartLoading(false);
              return;
            }
            if (cartDetails) {
              console.log("Using cached Take Away cart details");
              setCartData({
                ...cartDetails,
                serviceType: "Take Away",
              });
              setCartLoading(false);
              return;
            }
            endpoint = `${BASE_URL}Cart/get-cart-details`;
            params = { 
              Guid: activeTakeAwayOrder.id, 
              OrganizationsId: selectedOrganizationId 
            };
            shouldFetch = true;
            break;

          case "Delivery":
            console.log("Setting empty Delivery cart");
            setCartData({
              cartDetails: [],
              subTotal: "0.00",
              tax: "0.00",
              service: "0.00",
              serviceType: "Delivery",
            });
            setCartLoading(false);
            return;

          default:
            console.log("Invalid service type");
            setCartData(null);
            setCartLoading(false);
            return;
        }

        if (!shouldFetch) {
          setCartLoading(false);
          return;
        }

        console.log(`Fetching ${selectedServiceType} cart with params:`, params);
        const response = await axios.get(endpoint, {
          params,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (response.data && response.data.cartDetails) {
          const newCartData = {
            ...response.data,
            serviceType: selectedServiceType,
          };
          setCartData(newCartData);
          if (selectedServiceType === "Take Away") {
            updateCartDetails(newCartData);
          }
        } else {
          // If no cart details returned, set empty state
          setCartData({
            cartDetails: [],
            subTotal: "0.00",
            tax: "0.00",
            service: "0.00",
            serviceType: selectedServiceType,
          });
        }
      } catch (error) {
        console.error("Cart fetch error:", error);
        setCartError(`Failed to load cart data: ${error.message}`);
        setCartData(null);
      } finally {
        setCartLoading(false);
      }
    },
    [
      selectedServiceType,
      activeTakeAwayOrder,
      selectedTable,
      selectedOrganizationId,
      accessToken,
      cartDetails,
      updateCartDetails,
      BASE_URL,
      setCartData,
      setCartLoading,
      setCartError,
      resetCartState,
    ]
  );

  const handleServiceTypeChange = useCallback(
    (service) => {
      if (service === selectedServiceType) return;

      console.log(`Switching service type from ${selectedServiceType} to ${service}`);
      setIsTransitioning(true);
      resetCartState();

      // Cleanup previous service type state
      switch (selectedServiceType) {
        case "Dine in":
          setSelectedTableId(null);
          onClearTable();
          break;
        case "Take Away":
          clearActiveOrder();
          break;
        case "Delivery":
          setOrderNumber(generateOrderNumber());
          break;
        default:
          break;
      }

      // Set new service type
      setSelectedServiceType(service);
      switchServiceType(service);

      // Handle immediate state for new service type
      switch (service) {
        case "Take Away":
          if (!activeTakeAwayOrder) {
            setCartData({
              cartDetails: [],
              subTotal: "0.00",
              tax: "0.00",
              service: "0.00",
              serviceType: "Take Away",
            });
            setIsTransitioning(false);
            setCartLoading(false);
            return;
          }
          break;
        case "Delivery":
          setCartData({
            cartDetails: [],
            subTotal: "0.00",
            tax: "0.00",
            service: "0.00",
            serviceType: "Delivery",
          });
          setOrderNumber(generateOrderNumber());
          setIsTransitioning(false);
          setCartLoading(false);
          return;
        case "Dine in":
          if (!selectedTable?.id) {
            setCartData(null); // Set null to trigger empty view
            setIsTransitioning(false);
            setCartLoading(false);
            return;
          }
          break;
        default:
          break;
      }

      // Fetch new data if needed
      Promise.resolve().then(() => {
        fetchCartDetails(true);
        setIsTransitioning(false);
      });
    },
    [
      selectedServiceType,
      switchServiceType,
      fetchCartDetails,
      activeTakeAwayOrder,
      selectedTable,
      setSelectedTableId,
      onClearTable,
      generateOrderNumber,
      setSelectedServiceType,
      clearActiveOrder,
      resetCartState,
      setOrderNumber,
    ]
  );

  useEffect(() => {
    if (!selectedServiceType) {
      resetCartState();
      return;
    }

    if (isTransitioning) return;

    if (selectedServiceType === "Dine in" && !selectedTable?.id) {
      setCartData(null); // Ensure null state for no table
      setCartLoading(false);
      return;
    }

    if (selectedServiceType === "Take Away" && !activeTakeAwayOrder) {
      setCartData({
        cartDetails: [],
        subTotal: "0.00",
        tax: "0.00",
        service: "0.00",
        serviceType: "Take Away",
      });
      setCartLoading(false);
      return;
    }

    fetchCartDetails();
  }, [selectedServiceType, selectedTable, activeTakeAwayOrder, isTransitioning, fetchCartDetails, resetCartState]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (cartLoading || isTransitioning) {
        console.log("Safety timeout triggered");
        setCartLoading(false);
        setIsTransitioning(false);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [cartLoading, isTransitioning]);

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
    if (
      !cartData?.cartDetails?.[index] ||
      cartData.cartDetails[index].isKot !== 0 ||
      cartData.cartDetails[index].qty <= 1
    )
      return;

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

  const calculateBalance = () =>
    (parseFloat(amountEntered || "0.00") - parseFloat(calculateDiscountedTotal())).toFixed(2);

  const handlePlaceOrder = async () => {
    const orderDetails = getOrderDetails();
    if (!orderDetails?.id || !selectedOrganizationId || !accessToken) {
      message.error("Missing required information");
      return;
    }

    if (!cartData?.cartDetails?.length) {
      message.warning("No items in cart to place order");
      return;
    }

    try {
      await axios.post(
        `${BASE_URL}Cart/place-order?TableId=${orderDetails.id}`,
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
      const orderDetails = getOrderDetails();
      if (!orderDetails?.id) {
        throw new Error("No active order");
      }

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
        tableId: orderDetails.id,
        type: ["Dine in", "Take Away", "Delivery"].indexOf(orderDetails.type),
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
        resetCartState();
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
      console.error("Payment error:", err);
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

  const handleItemUpdate = useCallback(
    (index, action, value) => {
      if (!cartData?.cartDetails?.[index]) return;

      switch (action) {
        case "increase":
          handleQuantityIncrease(index);
          break;
        case "decrease":
          handleQuantityDecrease(index);
          break;
        case "note":
          handleNoteInputChange(index, value);
          break;
        case "addNote":
          handleAddNoteToDatabase(index);
          break;
        default:
          console.warn("Unknown update action:", action);
      }
    },
    [
      cartData,
      handleQuantityIncrease,
      handleQuantityDecrease,
      handleNoteInputChange,
      handleAddNoteToDatabase,
    ]
  );

  const renderOrderContent = () => {
    if (isTransitioning || cartLoading) {
      return <LoadingView isTransitioning={isTransitioning} />;
    }

    if (cartError) {
      return <ErrorView error={cartError} />;
    }

    // Explicitly check for empty states
    if (!cartData || (cartData && (!cartData.cartDetails || cartData.cartDetails.length === 0))) {
      return <EmptyCartView serviceType={selectedServiceType} />;
    }

    return <CartItemsList cartData={cartData} onUpdateItem={handleItemUpdate} />;
  };

  const renderHeader = () => {
    switch (selectedServiceType) {
      case "Dine in":
        return (
          <div className="table-header">
            <h2>{selectedTable ? selectedTable.name : "No table selected"}</h2>
            <p>Table Section</p>
            <div className="edit-icon">
              <i className="fa-edit fas"></i>
            </div>
          </div>
        );

      case "Take Away":
        return (
          <div className="table-header">
            <h2>{activeTakeAwayOrder ? activeTakeAwayOrder.name : "No order selected"}</h2>
            <p>Order Section</p>
            <div className="edit-icon">
              <i className="fa-shopping-bag fas"></i>
            </div>
          </div>
        );

      case "Delivery":
        return (
          <div className="table-header">
            <h2>{orderNumber}</h2>
            <p>Delivery Section</p>
            <div className="edit-icon">
              <i className="fa-motorcycle fas"></i>
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

      <div className={`order-items ${isTransitioning ? "transitioning" : ""}`}>
        {renderOrderContent()}
      </div>

      {cartData && !cartLoading && cartData.cartDetails.length > 0 && (
        <div className="totals">
          <p>
            SubTotal: <span>${(cartData.subTotal || 0).toFixed(2)}</span>
          </p>
          <p>
            Tax: <span>${(cartData.tax || 0).toFixed(2)}</span>
          </p>
          <p>
            Service: <span>${(cartData.service || 0).toFixed(2)}</span>
          </p>
          {(cartData.discount || 0) > 0 && (
            <p>
              Discount: <span>-${(cartData.discount || 0).toFixed(2)}</span>
            </p>
          )}
          <h3>
            Total: <span>${(cartData.subTotal || 0).toFixed(2)}</span>
          </h3>
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
          <div
            style={{
              background: "#fff",
              padding: "16px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
            }}
          >
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
          <div
            style={{
              background: "#fff",
              padding: "16px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
            }}
          >
            <Title level={4} style={{ color: "#52c41a", marginBottom: "16px" }}>
              Select Card Type
            </Title>
            <CardTypeSelector
              selectedCardType={selectedCardType}
              setSelectedCardType={setSelectedCardType}
            />
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
              disabled={
                parseFloat(amountEntered) < parseFloat(calculateDiscountedTotal()) || !selectedCardType
              }
            >
              Confirm Payment
            </Button>
          </div>
        </Col>
      </PaymentModal>

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
          <div
            style={{
              background: "#fff",
              padding: "16px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
            }}
          >
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

const LoadingView = ({ isTransitioning }) => (
  <div className="order-content-loading">
    <div className="loading-spinner">
      <i className="fa-spin fa-spinner fas"></i>
    </div>
    <div className="loading-text">
      <p>{isTransitioning ? "Switching service type..." : "Loading cart items..."}</p>
      {!isTransitioning && (
        <p className="sub-text">Please wait while we fetch your order details</p>
      )}
    </div>
  </div>
);

const ErrorView = ({ error }) => (
  <div className="order-content-error">
    <div className="error-icon">
      <i className="fa-exclamation-circle fas"></i>
    </div>
    <div className="error-text">
      <p>Something went wrong</p>
      <p className="sub-text">{error}</p>
    </div>
  </div>
);

const EmptyCartView = ({ serviceType }) => (
  <div className="no-items-state">
    <i className="fa-shopping-cart fas"></i>
    <p>No items in cart for {serviceType}</p>
    <p className="sub-text">Add items to get started</p>
  </div>
);

const CartItemsList = ({ cartData, onUpdateItem }) => {
  return cartData.cartDetails.map((item, index) => (
    <div key={item.id || index} className="order-item">
      <img src={item.image} alt={item.name} />
      <div className="order-details">
        <h4>{item.name}</h4>
        <div className="order-price">
          <span>${(item.price || 0).toFixed(2)}</span>
          <div className="quantity-controls">
            <button
              className="decrease qty-btn"
              disabled={item.qty <= 1 || item.isKot !== 0}
              onClick={() => onUpdateItem(index, "decrease")}
            >
              -
            </button>
            <span>{item.qty}x</span>
            <button
              className="increase qty-btn"
              disabled={item.isKot !== 0}
              onClick={() => onUpdateItem(index, "increase")}
            >
              +
            </button>
          </div>
        </div>
        <div className="input-container">
          <Input
            placeholder="Add notes"
            value={item.note || ""}
            onChange={(e) => onUpdateItem(index, "note", e.target.value)}
            disabled={item.isKot !== 0}
            style={{ marginTop: "8px", width: "calc(100% - 80px)" }}
          />
          <button
            className="add-note-btn"
            onClick={() => onUpdateItem(index, "addNote")}
            disabled={item.isKot !== 0}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  ));
};

export default OrderSummary;