import React, { useContext, useState } from "react";
import { Button, Input, Modal } from "antd";
import { useDelivery } from "../context/DeliveryContext";
import { useTakeAway } from "../context/TakeAwayContext";
import { TableContext } from "../context/TableContext";
import { useServiceType } from "../context/ServiceTypeContext";
import { AuthContext } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import axios from "axios";

const OtherServicesModal = ({ visible, onClose }) => {
  const [amount, setAmount] = useState(0);
  const [serviceName, setServiceName] = useState("");
  const { activeDeliveryOrder } = useDelivery();
  const { activeTakeAwayOrder } = useTakeAway();
  const { accessToken } = useContext(AuthContext);
  const { selectedTableId } = useContext(TableContext);
  const { selectedServiceType } = useServiceType();
  const { setCartData, setCartLoading, setCartError } = useCart();
  const BASE_URL = process.env.REACT_APP_API_URL;

  const fetchCartDetails = async (guid) => {
    try {
      setCartLoading(true);
      const response = await axios.get(`${BASE_URL}Cart/get-cart-details`, {
        params: { 
          Guid: guid,
          OrganizationsId: "1e7071f0-dacb-4a98-f264-08dcb066d923"
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data && response.data.cartDetails) {
        setCartData({
          ...response.data,
          serviceType: selectedServiceType,
        });
      }
    } catch (error) {
      console.error("Error fetching cart details:", error);
      setCartError("Failed to load cart data");
    } finally {
      setCartLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      console.log("Starting handleSave function");
      console.log("Current values:", {
        serviceName,
        amount,
        selectedServiceType,
      });
      console.log("Table ID:", selectedTableId);
      console.log("Take Away Order ID:", activeTakeAwayOrder?.id);
      console.log("Delivery Order ID:", activeDeliveryOrder?.id);

      let guid = "";
      let orderType = 0;

      // Determine which context to use based on selectedServiceType
      switch (selectedServiceType) {
        case "Delivery":
          if (activeDeliveryOrder) {
            console.log("Using Delivery context");
            guid = activeDeliveryOrder?.id;
            orderType = 2;
            console.log("Delivery order details:", {
              guid,
              orderType,
              activeDeliveryOrder,
            }); 
          }
          break;
        case "Take Away":
          if (activeTakeAwayOrder) {
            console.log("Using Take Away context");
            guid = activeTakeAwayOrder?.id;
            orderType = 1;
            console.log("Table order details:", {
              guid: guid,
              orderType: orderType,
              tableId: activeTakeAwayOrder?.id
            });
          }
          break;
        case "Dine in":
          if (selectedTableId) {
            console.log("Using Table context");
            guid = selectedTableId;
            orderType = 0;
            console.log("Table order details:", {
              guid: guid,
              orderType: orderType,
              tableId: selectedTableId
            });
          }
          break;
        default:
          console.error("Invalid service type:", selectedServiceType);
          throw new Error("Invalid service type selected");
      }

      if (!guid) {
        console.error(
          "No valid GUID found for service type:",
          selectedServiceType
        );
        throw new Error("No valid order or table selected");
      }

      const apiUrl = `${BASE_URL}Cart/add-to-cart`;
      const params = {
        Guid: guid,
        Qty: 1,
        cusId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        name: serviceName,
        value: amount,
        ordertype: orderType
      };

      console.log("Making API call to:", apiUrl, "with params:", params);

      const response = await axios.post(apiUrl, null, {
        params: params,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      console.log("API Response status:", response.status);
      console.log("API Response data:", response.data);

      if (response.status !== 200) {
        console.error("API call failed:", response.data);
        throw new Error("Failed to save service");
      }

      // Fetch updated cart data
      await fetchCartDetails(guid);

      alert("Service saved successfully");

      // Reset form and close modal
      setAmount(0);
      setServiceName("");
      
      onClose();
    } catch (error) {
      console.error("Error in handleSave:", error);
      console.error("Error stack:", error.stack);
      alert("Failed to save service. Please try again.");
    }
  };

  return (
    <Modal
      title={
        <div
          style={{
            textAlign: "center",
            marginBottom: "16px",
            fontSize: "24px",
          }}
        >
          Other Services
        </div>
      }
      visible={visible}
      onCancel={onClose}
      footer={[
        <Button
          key="save"
          type="primary"
          style={{ backgroundColor: "#28a745", borderColor: "#28a745" }}
          onClick={handleSave}
        >
          Save
        </Button>,
      ]}
      width={650}
      bodyStyle={{ height: "150px" }}
    >
      <div>
        <label>Enter Other Service:</label>
        <Input
          placeholder="Enter service name"
          style={{ marginBottom: "16px" }}
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
        />
      </div>
      <div>
        <label>Enter Amount:</label>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
    </Modal>
  );
};

export default OtherServicesModal;
