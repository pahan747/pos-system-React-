import React, { useState, useEffect, useContext } from "react";
import { Modal, Form, Input, Button, message, Select, Spin } from "antd";
import axios from "axios";
import { OrganizationContext } from "../context/OrganizationContext";
import { AuthContext } from "../context/AuthContext";
import { useCustomer } from "../context/CustomerContext";

const { Option } = Select;

const CustomerCreationModal = ({ visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [fetchingCustomers, setFetchingCustomers] = useState(false);
  const { selectedOrganizationId } = useContext(OrganizationContext);
  const { accessToken } = useContext(AuthContext);
  const [form] = Form.useForm();
  const BASE_URL = process.env.REACT_APP_API_URL;
  const { updateSelectedCustomer } = useCustomer();

  useEffect(() => {
    if (visible && selectedOrganizationId) {
      fetchCustomers();
    }
  }, [visible, selectedOrganizationId]);

  const fetchCustomers = async () => {
    setFetchingCustomers(true);
    try {
      const response = await axios.get(
        `${BASE_URL}Customer/GetAll-customers-in-organization`, {
          params: {
            OrganizationId: selectedOrganizationId
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          }
        }
      );
      setCustomers(response.data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      message.error("Failed to load customers");
    } finally {
      setFetchingCustomers(false);
    }
  };

  const handleFormSubmit = async (values) => {
    setLoading(true);
    try {
      const customerData = {
        name: values.name,
        organizationId: selectedOrganizationId,
        email: values.email,
        phone: values.phone
      };
      
      const response = await axios.post(
        `${BASE_URL}Customer/create-customer`,
        customerData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          }
        }
      );
      
      console.log("Customer created:", response.data);
      message.success("Customer created successfully!");
      
      form.resetFields();
      await fetchCustomers();
    } catch (error) {
      console.error("Error creating customer:", error);
      message.error(error.response?.data?.message || "Failed to create customer.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600',
          margin: 0,
          color: '#262626'
        }}>
          Select Customers
        </h2>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      maskClosable={false}
      style={{
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: 'auto',
        borderRadius: '10px 10px 0 0',
        transition: 'transform 0.3s ease-in-out',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
      }}
    >
      <Select
        showSearch
        placeholder="Search customers..."
        loading={fetchingCustomers}
        style={{ 
          width: '100%',
          marginBottom: '20px'
        }}
        optionFilterProp="label"
        filterOption={(input, option) => {
          // Ensure we're accessing the name property for filtering
          return customers.find(c => c.id === option.value)?.name?.toLowerCase()
            .includes(input.toLowerCase());
        }}
        options={customers.map(customer => ({
          value: customer.id,
          // For the selected value display
          label: customer.name,
          // For the dropdown display
          children: (
            <div style={{ display: 'flex', flexDirection: 'column', padding: '4px 0' }}>
              <span style={{ fontWeight: 500 }}>{customer.name}</span>
              <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
                {customer.phone} • {customer.email}
              </span>
            </div>
          )
        }))}
        onSelect={(value) => {
          const selectedCustomer = customers.find(c => c.id === value);
          updateSelectedCustomer(selectedCustomer.id, selectedCustomer.name);
          console.log("Selected customer:", selectedCustomer);
        }}
        notFoundContent={fetchingCustomers ? <Spin size="small" /> : null}
        dropdownStyle={{
          maxHeight: '400px',
          overflow: 'auto',
          padding: '8px 0'
        }}
      />

      <div>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600',
          marginBottom: '16px',
          color: '#262626',
          marginTop: '3px'
        }}>
          Create New Customer
        </h2>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
        >
          <Form.Item
            label="Customer Name"
            name="name"
            rules={[{ required: true, message: "Please enter the customer's name" }]}
          >
            <Input placeholder="Enter customer name" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please enter the customer's email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input placeholder="Enter customer email" />
          </Form.Item>
          <Form.Item
            label="Phone Number"
            name="phone"
            rules={[{ required: true, message: "Please enter the customer's phone number" }]}
          >
            <Input placeholder="Enter customer phone number" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'center', marginTop: '20px' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              style={{ 
                width: '100%', 
                backgroundColor: '#28a745', 
                borderColor: '#52c41a', 
                marginTop: '20px' 
              }}
            >
              Save Customer
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default CustomerCreationModal;