// src/components/BottomBar.js
import React, { useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import "../assets/css/components/BottomBar.css";
import { TableContext } from "../context/TableContext";
import { useServiceType } from "../context/ServiceTypeContext";

const BottomBar = ({ onTableSelect, onRefetchTables }) => {
  const [tables, setTables] = useState([]);
  const [takeAwayOrders, setTakeAwayOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { accessToken } = useContext(AuthContext);
  const { setSelectedTableId } = useContext(TableContext);
  const { selectedServiceType } = useServiceType();
  const BASE_URL = process.env.REACT_APP_API_URL;

  const organizationId = "1e7071f0-dacb-4a98-f264-08dcb066d923";

  const fetchTables = useCallback(async () => {
    try {
      if (!accessToken) {
        throw new Error("Access token missing. Please log in.");
      }

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
      setLoading(false);
    } catch (err) {
      setError("Failed to load table data");
      setLoading(false);
      console.error(err);
    }
  }, [accessToken, BASE_URL, organizationId]);

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

  // Expose fetchTables to parent component via a callback
  useEffect(() => {
    if (onRefetchTables) {
      onRefetchTables(fetchTables);
    }
  }, [onRefetchTables, fetchTables]);

  const handleTableClick = (table) => {
    setSelectedTableId(table.id);
    onTableSelect(table);
  };

  const handleAddTakeAwayOrder = () => {
    const newOrder = {
      id: `takeaway-${takeAwayOrders.length + 1}`,
      tableId: `TA-${takeAwayOrders.length + 1}`,
      name: `Take Away #${takeAwayOrders.length + 1}`,
      items: 0,
      status: "Open"
    };
    setTakeAwayOrders([...takeAwayOrders, newOrder]);
    handleTableClick(newOrder);
  };

  const renderBottomBar = () => {
    switch (selectedServiceType) {
      case "Dine in":
        if (loading) return <div>Loading tables...</div>;
        if (error) return <div>{error}</div>;

        return (
          <div className="bottom-bar">
            {tables.map((table, index) => (
              <div
                key={index}
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

      case "Take Away":
        return (
          <div className="bottom-bar">
            {takeAwayOrders.map((order, index) => (
              <div
                key={index}
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
              className="table-status" 
              onClick={handleAddTakeAwayOrder}
              style={{ cursor: "pointer" }}
            >
              <span className="table-id">+</span>
              <div className="table-info">
                <p>Add New Order</p>
                <p>0.0 items</p>
              </div>
              <span className="process-status Open">Open</span>
            </div>
          </div>
        );

      case "Delivery":
        return (
          <div className="bottom-bar delivery">
            <div className="delivery-info">
              <i className="fas fa-motorcycle"></i>
              <span>Delivery Status</span>
            </div>
            <div className="actions">
              <button className="track-delivery">
                <i className="fas fa-map-marker-alt"></i>
                Track Delivery
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return renderBottomBar();
};

export default BottomBar;
