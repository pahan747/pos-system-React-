import React, { useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { TableContext } from "../context/TableContext";
import { useServiceType } from "../context/ServiceTypeContext";
import { useTakeAway } from "../context/TakeAwayContext";
import { message } from "antd";
import { useDelivery } from "../context/DeliveryContext";
import { useCart } from "../context/CartContext";
import { useCustomer } from "../context/CustomerContext";
import "../assets/css/components/BottomBar.css";

const SERVICE_TYPE_MAP = {
  "Dine in": 0,
  "Take Away": 1,
  "Delivery": 2,
};

const BottomBar = ({ onTableSelect, onRefetchTables }) => {
  // Common state and context
  const { accessToken } = useContext(AuthContext);
  const { setSelectedTableId } = useContext(TableContext);
  const { selectedServiceType } = useServiceType();
  const { addTakeAwayOrder, handleTakeAwayOrderSelect, clearActiveOrder } = useTakeAway();
  const { addDeliveryOrder, handleDeliveryOrderSelect, clearActiveDeliveryOrder } = useDelivery(); 
  const { cartData } = useCart();
  const { selectedCustomer } = useCustomer();
  const BASE_URL = process.env.REACT_APP_API_URL;
  const organizationId = "1e7071f0-dacb-4a98-f264-08dcb066d923";

  // Dine-in specific state
  const [tables, setTables] = useState([]);
  const [dineInLoading, setDineInLoading] = useState(true);
  const [dineInError, setDineInError] = useState(null);

  // Take-away specific state
  const [takeawayOrders, setTakeawayOrders] = useState([]);
  const [takeawayLoading, setTakeawayLoading] = useState(false);

  // Delivery specific state
  const [deliveryOrders, setDeliveryOrders] = useState([]); 
  const [deliveryLoading, setDeliveryLoading] = useState(false);

  // Dine-in specific functions
  const fetchTables = useCallback(async () => {
    try {
      if (!accessToken) {
        throw new Error("Access token missing. Please log in.");
      }

      setDineInLoading(true);
      setDineInError(null);

      const config = {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      };

      const response = await axios.get(
        `${BASE_URL}Table?guid=${organizationId}`,
        config
      );

      const transformedTables = response.data
        .map((table) => ({
          id: table.id,
          tableId: table.name,
          name: table.fullName,
          items: table.count,
          status: table.count > 0 ? "Process" : "Open",
        }))
        .sort((a, b) =>
          a.tableId.localeCompare(b.tableId, undefined, { numeric: true })
        );

      setTables(transformedTables);
    } catch (err) {
      setDineInError(
        err.response?.data?.message || "Failed to load table data"
      );
      console.error("Error fetching tables:", err);
    } finally {
      setDineInLoading(false);
    }
  }, [accessToken, BASE_URL, organizationId, cartData]);

  // Add new function to update table status
  const updateTableStatus = useCallback((tableId, items) => {
    setTables(prevTables => 
      prevTables.map(table => 
        table.id === tableId 
          ? { ...table, status: items > 0 ? "Process" : "Open" }
          : table
      )
    );
  }, []);

  // Take-away specific functions
  const fetchTakeawayOrders = useCallback(async () => {
    try {
      if (!accessToken) {
        throw new Error("Access token missing. Please log in.");
      }

      setTakeawayLoading(true);

      const config = {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      };

      const response = await axios.get(
        `${BASE_URL}Cart/get-takeaway-orders?OrganizationsId=${organizationId}`,
        config
      );

      const transformedOrders = response.data
        .map((order, index) => ({
          id: order.tableId,
          tableId: `TA ${index + 1}`,
          name: `Take Away ${index + 1}`,
          items: "0",
          status: "Open",
          createUtc: order.createUtc,
        }))
        .sort((a, b) => new Date(a.createUtc) - new Date(b.createUtc));

      setTakeawayOrders(transformedOrders);
    } catch (err) {
      console.error("Error fetching takeaway orders:", err);
      message.error(
        err.response?.data?.message || "Failed to load takeaway orders"
      );
    } finally {
      setTakeawayLoading(false);
    }
  }, [accessToken, BASE_URL, organizationId]);

  const handleAddTakeAwayOrder = async () => {
    try {
      const newOrder = addTakeAwayOrder();

      await axios.post(
          `${BASE_URL}Cart/add-takeaway-order?tableId=${newOrder.id}&customerId=${selectedCustomer?.id}&orderType=1`,
        null,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      handleTableClick(newOrder);
      message.success("New takeaway order created successfully!");
      await fetchTakeawayOrders();
    } catch (err) {
      console.error("Error initializing takeaway cart:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to create new takeaway order";
      message.error(`Error: ${errorMessage}`);
    }
  };

  // Delivery specific functions
  const fetchDeliveryOrders = useCallback(async () => {
    try {
      if (!accessToken) throw new Error("Access token missing. Please log in.");
      setDeliveryLoading(true);

      const config = { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } };
      const response = await axios.get(`${BASE_URL}Cart/get-delivery-orders?OrganizationsId=${organizationId}`, config);

      const transformedOrders = response.data
        .map((order, index) => ({
          id: order.tableId,
          tableId: `DL ${index + 1}`,
          name: `Delivery ${index + 1}`,
          items: "0",
          status: "Open",
          createUtc: order.createUtc,
        }))
        .sort((a, b) => new Date(a.createUtc) - new Date(b.createUtc));

      setDeliveryOrders(transformedOrders); // Local state
    } catch (err) {
      console.error("Error fetching delivery orders:", err);
      message.error(err.response?.data?.message || "Failed to load delivery orders");
    } finally {
      setDeliveryLoading(false);
    }
  }, [accessToken, BASE_URL, organizationId]);

  const handleAddDeliveryOrder = async () => {
    try {
      const newOrder = addDeliveryOrder(); // Still use context to generate order
      await axios.post(
        `${BASE_URL}Cart/add-delivery-order?tableId=${newOrder.id}&customerId=${selectedCustomer?.id}&orderType=2`,
        null,
        { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
      );
      handleTableClick(newOrder);
      message.success("New delivery order created successfully!");
      await fetchDeliveryOrders();
    } catch (err) {
      console.error("Error initializing delivery cart:", err);
      message.error(err.response?.data?.message || "Failed to create new delivery order");
    }
  };

  // Common functions
  const handleTableClick = (table) => {
    console.log("Table/Order clicked:", {
      id: table,
      serviceType: selectedServiceType,
      isTakeAway: selectedServiceType === "Take Away",
      isDelivery: selectedServiceType === "Delivery",
    });

    if (selectedServiceType === "Take Away") {
      handleTakeAwayOrderSelect(table);
      setSelectedTableId(null);
      clearActiveDeliveryOrder();
    } else if (selectedServiceType === "Delivery") {
      handleDeliveryOrderSelect(table);
      setSelectedTableId(null);
      clearActiveOrder();
    } else { 
      setSelectedTableId(table.id);
      onTableSelect(table);
      clearActiveOrder();
      clearActiveDeliveryOrder();
    }
  };

  // UI Components
  const renderLoadingState = () => (
    <div className="bottom-bar loading">
      <p>Loading...</p>
    </div>
  );

  const renderErrorState = (errorMessage) => (
    <div className="bottom-bar error">
      <i className="fa-exclamation-circle fas"></i>
      <p>{errorMessage}</p>
    </div>
  );

  const renderDineInSection = () => {
    if (dineInLoading) return renderLoadingState();
    if (dineInError) return renderErrorState(dineInError);

    return (
      <div className="bottom-bar">
        {tables.map((table) => (
          <div
            key={table.id}
            className="table-status"
            onClick={() => handleTableClick(table)}
            style={{ cursor: "pointer" }}
          >
            <span className="table-id">{table.tableId}</span>
            <div className="table-info">
              <p>{table.name}</p>
              <p>{table.items}.0 items</p>
            </div>
            <span className={`process-status ${table.status}`}>
              {table.status}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderTakeAwaySection = () => {
    if (takeawayLoading) return renderLoadingState();

    return (
      <div className="bottom-bar">
        {takeawayOrders.map((order) => (
          <div
            key={order.id}
            className="table-status"
            onClick={() => handleTableClick(order)}
            style={{ cursor: "pointer" }}
          >
            <span className="table-id">{order.tableId}</span>
            <div className="table-info">
              <p>{order.name}</p>
              <p>{order.items}.0 items</p>
            </div>
            <span className={`process-status ${order.status}`}>
              {order.status}
            </span>
          </div>
        ))}
        <div
          className="table-status add-new"
          onClick={handleAddTakeAwayOrder}
          style={{ cursor: "pointer" }}
        >
          <span className="table-id">+</span>
          <div className="table-info">
            <p>Add New Order</p>
            <p>0.0 orders</p>
          </div>
          <span className="Open process-status">Open</span>
        </div>
      </div>
    );
  };

  const renderDeliverySection = () => {
    if (deliveryLoading) return renderLoadingState();

    return (
      <div className="bottom-bar">
        {deliveryOrders.map((order) => (
          <div
            key={order.id}
            className="table-status"
            onClick={() => handleTableClick(order)}
            style={{ cursor: "pointer" }}
          >
            <span className="table-id">{order.tableId}</span>
            <div className="table-info">
              <p>{order.name}</p>
              <p>{order.items}.0 items</p>
            </div>
            <span className={`process-status ${order.status}`}>
              {order.status}
            </span>
          </div>
        ))}
        <div
          className="table-status add-new"
          onClick={handleAddDeliveryOrder}
          style={{ cursor: "pointer" }}
        >
          <span className="table-id">+</span>
          <div className="table-info">
            <p>Add New Delivery</p>
            <p>0.0 orders</p>
          </div>
          <span className="Open process-status">Open</span>
        </div>
      </div>
    );
  };

  // Effects
  useEffect(() => {
    let isMounted = true;

    const loadTables = async () => {
      if (!isMounted) return;
      await fetchTables();
    };

    loadTables();

    return () => {
      isMounted = false;
    };
  }, [fetchTables]);

  useEffect(() => {
    if (onRefetchTables) {
      onRefetchTables(fetchTables);
    }
  }, [onRefetchTables, fetchTables]);

  useEffect(() => {
    if (selectedServiceType === "Take Away") {
      fetchTakeawayOrders();
    } else if (selectedServiceType === "Delivery") {
      fetchDeliveryOrders();
    }
  }, [selectedServiceType, fetchTakeawayOrders, fetchDeliveryOrders]);

  // Main render
  const renderBottomBar = () => {
    switch (selectedServiceType) {
      case "Dine in":
        return renderDineInSection();
      case "Take Away":
        return renderTakeAwaySection();
      case "Delivery":
        return renderDeliverySection();
      default:
        return null;
    }
  };

  return renderBottomBar();
};

export default BottomBar;
