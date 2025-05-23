import React, { useContext, useEffect, useState, useCallback } from "react";
import { OrganizationContext } from "../context/OrganizationContext";
import { AuthContext } from "../context/AuthContext";
import { TableContext } from "../context/TableContext";
import { useCart } from "../context/CartContext";
import { useTakeAway } from "../context/TakeAwayContext";
import { useDelivery } from "../context/DeliveryContext"; // Imported DeliveryContext to manage Delivery orders like Take Away
import axios from "axios";
import { Button, Input, Col, message } from "antd";
import ReceiptDetails from "./ReceiptDetails";
import PaymentKeypad from "./PaymentKeypad";
import CardTypeSelector from "./CardTypeSelector";
import PaymentModal from "./PaymentModal";
import { Typography } from "antd";
import { useServiceType } from "../context/ServiceTypeContext";
import CustomerCreationModal from "./CustomerCreationModal";
import { useCustomer } from "../context/CustomerContext";
import "../assets/css/components/OrderSummary.css";

const { Title, Text } = Typography;

const OrderSummary = ({ selectedTable, onClearTable }) => {
  const { selectedOrganizationId } = useContext(OrganizationContext);
  const { selectedTableId, setSelectedTableId } = useContext(TableContext);
  const { accessToken } = useContext(AuthContext);
  const {
    cartData,
    setCartData,
    cartLoading,
    setCartLoading,
    cartError,
    setCartError,
  } = useCart();
  const {
    activeTakeAwayOrder,
    cartDetails,
    updateCartDetails,
    clearActiveOrder,
    switchServiceType: switchTakeAwayServiceType,
  } = useTakeAway();
  // Added DeliveryContext variables
  const {
    activeDeliveryOrder,
    deliveryCartDetails,
    updateDeliveryCartDetails,
    clearActiveDeliveryOrder,
    switchDeliveryServiceType,
  } = useDelivery();
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
  const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false);
  const { selectedCustomer } = useCustomer();

  const handleCustomerIconClick = () => {
    setIsCustomerModalVisible(true);
  };

  const handleCustomerModalClose = () => {
    setIsCustomerModalVisible(false);
  };

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
      // Updated Delivery case to use activeDeliveryOrder
      case "Delivery":
        return {
          id: activeDeliveryOrder?.id,
          name: activeDeliveryOrder?.name || "No order selected",
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
      console.log("Delivery Order ID:", activeDeliveryOrder?.id);

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
              setCartData(null);
              setCartLoading(false);
              return;
            }
            endpoint = `${BASE_URL}Cart/get-cart-details`;
            params = {
              Guid: selectedTable.id,
              OrganizationsId: selectedOrganizationId,
            };
            shouldFetch = true;
            break;

          case "Take Away":
            if (!activeTakeAwayOrder?.id) {
              console.log("No active Take Away order");
              setCartData(null); // Set to null instead of empty cart
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
              OrganizationsId: selectedOrganizationId,
            };
            shouldFetch = true;
            break;

          case "Delivery":
            if (!activeDeliveryOrder?.id) {
              console.log("No active Delivery order");
              setCartData(null);
              setCartLoading(false);
              return;
            }
            if (deliveryCartDetails) {
              console.log("Using cached Delivery cart details");
              setCartData({
                ...deliveryCartDetails,
                serviceType: "Delivery",
              });
              setCartLoading(false);
              return;
            }
            endpoint = `${BASE_URL}Cart/get-cart-details`;
            params = {
              Guid: activeDeliveryOrder.id,
              OrganizationsId: selectedOrganizationId,
            };
            shouldFetch = true;
            break;

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

        console.log(
          `Fetching ${selectedServiceType} cart with params:`,
          params
        );
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
            // Cache fetched cart data in DeliveryContext for Delivery, like Take Away
          } else if (selectedServiceType === "Delivery") {
            updateDeliveryCartDetails(newCartData);
          }
        } else {
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
      activeDeliveryOrder,
      selectedTable,
      selectedOrganizationId,
      accessToken,
      cartDetails,
      deliveryCartDetails,
      updateCartDetails,
      updateDeliveryCartDetails,
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

      console.log(
        `Switching service type from ${selectedServiceType} to ${service}`
      );
      setIsTransitioning(true);
      resetCartState();

      switch (selectedServiceType) {
        case "Dine in":
          setSelectedTableId(null);
          onClearTable();
          break;
        case "Take Away":
          clearActiveOrder();
          break;
        // Clear active Delivery order when switching away, like Take Away
        case "Delivery":
          clearActiveDeliveryOrder();
          break;
        default:
          break;
      }

      setSelectedServiceType(service);
      switchTakeAwayServiceType(service);
      switchDeliveryServiceType(service); // Update DeliveryContext service type, like TakeAwayContext

      switch (service) {
        case "Take Away":
          if (!activeTakeAwayOrder?.id) {
            setCartData(null); // Set to null for no active order
            setIsTransitioning(false);
            setCartLoading(false);
            return;
          }
          break;
        case "Delivery":
          if (!activeDeliveryOrder?.id) {
            setCartData(null);
            setIsTransitioning(false);
            setCartLoading(false);
            return;
          }
          break;
        case "Dine in":
          if (!selectedTable?.id) {
            setCartData(null);
            setIsTransitioning(false);
            setCartLoading(false);
            return;
          }
          break;
        default:
          break;
      }

      Promise.resolve().then(() => {
        fetchCartDetails(true);
        setIsTransitioning(false);
      });
    },
    [
      selectedServiceType,
      switchTakeAwayServiceType,
      switchDeliveryServiceType,
      fetchCartDetails,
      activeTakeAwayOrder,
      activeDeliveryOrder,
      selectedTable,
      setSelectedTableId,
      onClearTable,
      setSelectedServiceType,
      clearActiveOrder,
      clearActiveDeliveryOrder,
      resetCartState,
    ]
  );

  useEffect(() => {
    if (!selectedServiceType) {
      resetCartState();
      return;
    }

    if (isTransitioning) return;

    if (selectedServiceType === "Dine in" && !selectedTable?.id) {
      setCartData(null);
      setCartLoading(false);
      return;
    }

    if (selectedServiceType === "Take Away" && !activeTakeAwayOrder?.id) {
      setCartData(null);
      setCartLoading(false);
      return;
    }

    // Added check for active Delivery order
    if (selectedServiceType === "Delivery" && !activeDeliveryOrder?.id) {
      setCartData(null);
      setCartLoading(false);
      return;
    }

    fetchCartDetails();
  }, [
    selectedServiceType,
    selectedTable,
    activeTakeAwayOrder,
    activeDeliveryOrder,
    isTransitioning,
    fetchCartDetails,
    resetCartState,
  ]);

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
    if (
      !cartData?.cartDetails?.[index] ||
      cartData.cartDetails[index].isKot !== 0
    )
      return;

    setCartData((prev) => {
      const newCartDetails = [...prev.cartDetails];
      newCartDetails[index].note = value;
      return { ...prev, cartDetails: newCartDetails };
    });
  };

  const handleQuantityIncrease = async (index) => {
    if (
      !cartData?.cartDetails?.[index] ||
      cartData.cartDetails[index].isKot !== 0
    )
      return;
  
    try {
      const item = cartData.cartDetails[index];
      const orderDetails = getOrderDetails();
      if (!orderDetails?.id) {
        message.error("No active order found");
        return;
      }
  
      // Determine which type of order we're dealing with
      const params = {
        Guid: orderDetails.id,
        ProductId: item.productId,
        Qty: 1, // Adding 1 more to existing quantity
        cusId: selectedCustomer?.id,
        name: item.name,
        value: item.price,
        ordertype: ["Dine in", "Take Away", "Delivery"].indexOf(orderDetails.type),
        OrganizationsId: selectedOrganizationId,
      };
  
      // Make API call to add to cart (which increases quantity)
      await axios.post(
        `${BASE_URL}Cart/add-to-cart`,
        null,
        {
          params,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      // Update local state optimistically for better UX
      setCartData((prev) => {
        const newCartDetails = [...prev.cartDetails];
        newCartDetails[index].qty += 1;
        return { ...prev, cartDetails: newCartDetails };
      });
  
      // Refresh cart details from server
      await fetchCartDetails(true);
      
    } catch (error) {
      console.error("Failed to increase quantity:", error);
      message.error("Failed to update quantity. Please try again.");
    }
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
    if (
      !cartData?.cartDetails?.[index] ||
      cartData.cartDetails[index].isKot !== 0
    )
      return;

    const noteValue = cartData.cartDetails[index].note || "";
    try {
      await axios.post(
        `${BASE_URL}Cart/add-note`,
        { cartDetailId: cartData.cartDetails[index].id, note: noteValue },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      await fetchCartDetails();
    } catch (err) {
      setCartError("Failed to add note.");
      console.error(err);
    }
  };

  const calculateSubTotal = () => {
    if (!cartData?.cartDetails) return "0.00";
    return cartData.cartDetails.reduce((sum, item) => {
      return sum + (item.price * item.qty);
    }, 0).toFixed(2);
  };

  const calculateTotal = () => {
    const subTotal = parseFloat(calculateSubTotal());
    const tax = parseFloat(cartData?.tax || "0.00");
    const service = parseFloat(cartData?.service || "0.00");
    const discountPercentage = parseFloat(discount || "0") / 100;
    const discountAmount = subTotal * discountPercentage;
    
    return (subTotal + tax + service - discountAmount).toFixed(2);
  };

  const calculateBalance = () =>
    (
      parseFloat(amountEntered || "0.00") -
      parseFloat(calculateTotal())
    ).toFixed(2);

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
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
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
          productId: item.productId,
          qty: item.qty || 0,
          price: item.price || 0,
          amount: (item.qty || 0) * (item.price || 0),
          status: 0,
          spicy: item.note || "",
          name: item.name || "",
        }));

      const subTotal = parseFloat(calculateSubTotal());
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
        customerID: selectedCustomer?.id,
        organizationId: selectedOrganizationId,
        details: details,
      };

      const response = await axios.post(
        `${BASE_URL}Invoice/create-invoice-new`,
        orderData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        // First delete the cart
        try {
          await axios.delete(`${BASE_URL}Cart/delete-cart`, {
            params: { tableId: orderDetails.id },
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          });
        } catch (error) {
          console.error("Failed to delete cart:", error);
          // Continue with other operations even if cart deletion fails
        }

        // Then proceed with existing success operations
        message.success(`Payment successful via ${method}!`);
        resetCartState();
        setShowCashModal(false);
        setShowCardModal(false);
        setShowQRModal(false);
        setAmountEntered("0.00");
        setDiscount("0");
        setSelectedCardType(null);
        setSelectedPayment(null);
        
        // Clear active orders based on service type
        if (selectedServiceType === "Take Away") {
          clearActiveOrder();
        } else if (selectedServiceType === "Delivery") {
          clearActiveDeliveryOrder();
        }
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
      if (parseFloat(amountEntered) >= parseFloat(calculateTotal())) {
        handlePaymentConfirm(selectedPayment);
      }
    } else {
      const currentAmount =
        amountEntered === "0.00" ? "" : amountEntered.replace(".00", "");
      const newValue = currentAmount + value;
      setAmountEntered(newValue + ".00");
    }
  };

  const handleDeleteItem = async (index) => {
    if (!cartData?.cartDetails?.[index]) return;

    try {
      const item = cartData.cartDetails[index];
      console.log("Deleting item with ProductId:", item.productId);
      const orderDetails = getOrderDetails();
      if (!orderDetails?.id) {
        message.error("No active order found");
        return;
      }

      await axios.delete(`${BASE_URL}Cart/delete-cart-item`, {
        params: {
          Guid: orderDetails.id,
          ProductId: item.productId,
          OrganizationsId: selectedOrganizationId,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      // Update local state optimistically
      setCartData((prev) => {
        const newCartDetails = [...prev.cartDetails];
        newCartDetails.splice(index, 1);
        return { ...prev, cartDetails: newCartDetails };
      });

      // Refresh cart details from server
      await fetchCartDetails(true);
      message.success("Item removed successfully");
      console.log();
    } catch (error) {
      console.error("Failed to delete item:", error);
      message.error("Failed to remove item. Please try again.");
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
        case "delete":
          handleDeleteItem(index);
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
      handleDeleteItem,
    ]
  );

  const renderOrderContent = () => {
    if (isTransitioning || cartLoading) {
      return <LoadingView isTransitioning={isTransitioning} />;
    }

    if (cartError) {
      return <ErrorView error={cartError} />;
    }

    if (selectedServiceType === "Dine in" && !selectedTable?.id) {
      return <NoTableSelectedView />;
    }

    if (selectedServiceType === "Take Away" && !activeTakeAwayOrder?.id) {
      return <NoTakeAwayOrderSelectedView />;
    }

    // Added check for Delivery with a custom view, like Take Away
    if (selectedServiceType === "Delivery" && !activeDeliveryOrder?.id) {
      return <NoDeliveryOrderSelectedView />;
    }
 
    if (
      !cartData ||
      (cartData && (!cartData.cartDetails || cartData.cartDetails.length === 0))
    ) {
      return <EmptyCartView serviceType={selectedServiceType} />;
    }

    return (
      <CartItemsList cartData={cartData} onUpdateItem={handleItemUpdate} />
    );
  };

  const renderHeader = () => {
    switch (selectedServiceType) {
      case "Dine in":
        return (
          <>
            <div className="table-header">
              <h2>
                {selectedTable ? selectedTable.name : "No table selected"}
              </h2>
              <p>Table Section</p>
              <div className="edit-icon" onClick={handleCustomerIconClick}>
                <i
                  className="fa-user fas"
                  onClick={handleCustomerIconClick}
                ></i>
              </div>
            </div>
            <div
              style={{
                borderBottom: "1px solid #e8e8e8",
                marginBottom: "15px",
                paddingBottom: "10px",
              }}
            >
              <p
                style={{
                  fontSize: "15px",
                  color: "#8c8c8c",
                  margin: "0",
                  fontWeight: "400",
                }}
              >
                Customer : {selectedCustomer?.name || "No customer selected"}
              </p>
            </div>
          </>
        );

      case "Take Away":
        return (
          <>
            <div className="table-header">
              <h2>
                {activeTakeAwayOrder
                  ? activeTakeAwayOrder.name
                  : "No order selected"}
              </h2>
              <p>Order Section</p>
              <div className="edit-icon" onClick={handleCustomerIconClick}>
                <i
                  className="fa-user fas"
                  onClick={handleCustomerIconClick}
                ></i>
              </div>
            </div>
            <div
              style={{
                borderBottom: "1px solid #e8e8e8",
                marginBottom: "15px",
                paddingBottom: "10px",
              }}
            >
              <p
                style={{
                  fontSize: "15px",
                  color: "#8c8c8c",
                  margin: "0",
                  fontWeight: "400",
                }}
              >
                Customer : {selectedCustomer?.name || "No customer selected"}
              </p>
            </div>
          </>
        );

      case "Delivery":
        return (
          <>
            <div className="table-header">
              <h2>
                {activeDeliveryOrder
                  ? activeDeliveryOrder.name
                  : "No order selected"}
              </h2>
              <p>Delivery Section</p>
              <div className="edit-icon" onClick={handleCustomerIconClick}>
                <i
                  className="fa-user fas"
                  onClick={handleCustomerIconClick}
                ></i>
              </div>
            </div>
            <div
              style={{
                borderBottom: "1px solid #e8e8e8",
                marginBottom: "15px",
                paddingBottom: "10px",
              }}
            >
              <p
                style={{
                  fontSize: "15px",
                  color: "#8c8c8c",
                  margin: "0",
                  fontWeight: "400",
                }}
              >
                Customer : {selectedCustomer?.name || "No customer selected"}
              </p>
            </div>
          </>
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
            className={`service-btn ${
              selectedServiceType === service ? "active" : ""
            }`}
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
            SubTotal: <span>${calculateSubTotal()}</span>
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
            Total: <span>${calculateTotal()}</span>
          </h3>
        </div>
      )}

      <div className="payment-options">
        {["Cash", "Card", "QR"].map((method) => (
          <button
            key={method}
            className={`payment-btn ${
              selectedPayment === method ? "active" : ""
            }`}
            onClick={() => setSelectedPayment(method)}
          >
            {/* <i
              className={`fas fa-${
                method === "Cash"
                  ? "money-bill-wave"
                  : method === "Card"
                  ? "credit-card"
                  : "qrcode"
              }`}
   
                     ></i>{" "} */}
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

      <CustomerCreationModal
        visible={isCustomerModalVisible}
        onClose={handleCustomerModalClose}
      />

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
            calculateDiscountedTotal={calculateTotal}
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
              disabled={
                parseFloat(amountEntered) <
                parseFloat(calculateTotal())
              }
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
            calculateDiscountedTotal={calculateTotal}
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
                parseFloat(amountEntered) <
                  parseFloat(calculateTotal()) || !selectedCardType
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
            calculateDiscountedTotal={calculateTotal}
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
              disabled={
                parseFloat(amountEntered) <
                parseFloat(calculateTotal())
              }
            >
              Confirm Payment
            </Button>
          </div>
        </Col>
      </PaymentModal>

      <CustomerCreationModal
        visible={isCustomerModalVisible}
        onClose={handleCustomerModalClose}
      />
    </aside>
  );
};

const LoadingView = ({ isTransitioning }) => (
  <div className="order-content-loading">
    <div className="loading-spinner">
      <i className="fa-spin fa-spinner fas"></i>
    </div>
    <div className="loading-text">
      <p>
        {isTransitioning
          ? "Switching service type..."
          : "Loading cart items..."}
      </p>
      {!isTransitioning && (
        <p className="sub-text">
          Please wait while we fetch your order details
        </p>
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

const NoTableSelectedView = () => (
  <div className="no-items-state">
    <i className="fa-table fas"></i>
    <p>No table selected</p>
    <p className="sub-text">Table selected to get started</p>
  </div>
);

const NoTakeAwayOrderSelectedView = () => (
  <div className="no-items-state">
    <i className="fa-shopping-bag fas"></i>
    <p>No take away order selected</p>
    <p className="sub-text">Take away order selected to get started</p>
  </div>
);

const NoDeliveryOrderSelectedView = () => (
  <div className="no-items-state">
    <i className="fa-motorcycle fas"></i>
    <p>No delivery order selected</p>
    <p className="sub-text">Delivery order selected to get started</p>
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
            <button
              className="delete-btn"
              onClick={() => onUpdateItem(index, "delete")}
              disabled={item.isKot !== 0}
            >
              <i className="fas fa-trash"></i>
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
