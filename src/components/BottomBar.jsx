// src/components/BottomBar.js
import React, { useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import "../assets/css/components/BottomBar.css";
import { TableContext } from "../context/TableContext";
import { useServiceType } from "../context/ServiceTypeContext";
import { useTakeAway } from "../context/TakeAwayContext";
import { message } from "antd";

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
  const BASE_URL = process.env.REACT_APP_API_URL;
  const organizationId = "1e7071f0-dacb-4a98-f264-08dcb066d923";

  // Dine-in specific state
  const [tables, setTables] = useState([]);
  const [dineInLoading, setDineInLoading] = useState(true);
  const [dineInError, setDineInError] = useState(null);

  // Take-away specific state
  const [takeawayOrders, setTakeawayOrders] = useState([]);
  const [takeawayLoading, setTakeawayLoading] = useState(false);

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
          status: table.status === 99 ? "Process" : "Open",
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
  }, [accessToken, BASE_URL, organizationId]);

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
        `${BASE_URL}Cart/add-takeaway-order?tableId=${newOrder.id}&customerId=80ebf3b0-a2d7-49d2-6a06-08dcda15281e&orderType=1`,
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

  // Common functions
  const handleTableClick = (table) => {
    console.log("Table/Order clicked:", {
      id: table.id,
      serviceType: selectedServiceType,
      isTakeAway: selectedServiceType === "Take Away"
    });

    if (selectedServiceType === "Take Away") {
      // For Take Away, only update Take Away context
      handleTakeAwayOrderSelect(table);
      // Clear any selected table
      setSelectedTableId(null);
    } else {
      // For Dine in, update table context and clear Take Away
      setSelectedTableId(table.id);
      onTableSelect(table);
      clearActiveOrder();
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

  const renderDeliverySection = () => (
    <div className="bottom-bar delivery">
      <div className="delivery-info">
        <i className="fa-motorcycle fas"></i>
        <span>Delivery Status</span>
      </div>
      <div className="actions">
        <button className="track-delivery">
          <i className="fa-map-marker-alt fas"></i>
          Track Delivery
        </button>
      </div>
    </div>
  );

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
    }
  }, [selectedServiceType, fetchTakeawayOrders]);

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
