import React, { useState } from "react";
import { Modal, Form, Input, Button, message } from "antd";

const CustomerCreationModal = ({ visible, onClose }) => {
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (values) => {
    setLoading(true);
    try {
      // Replace with your API call to create a customer
      console.log("Customer Data:", values);
      message.success("Customer created successfully!");
      onClose();
    } catch (error) {
      console.error("Error creating customer:", error);
      message.error("Failed to create customer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Create New Customer"
      visible={visible}
      onCancel={onClose}
      footer={null}
    >
      <Form layout="vertical" onFinish={handleFormSubmit}>
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
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Create Customer
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CustomerCreationModal;