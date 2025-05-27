import React from "react";
import { Row, Col, Button, Form, Input } from "antd";

const CardTypeSelector = ({ selectedCardType, setSelectedCardType }) => (
  <div>
    <Row gutter={[12, 12]}>
      {["Visa", "MasterCard", "GCash"].map((type) => (
        <Col span={8} key={type}>
          <Button
            onClick={() => setSelectedCardType(type)}
            style={{
              width: "80%",
              height: "40px",
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              border: selectedCardType === type ? "2px solid #52c41a" : "1px solid #d9d9d9",
              backgroundImage: `url(https://upload.wikimedia.org/wikipedia/commons/${
                type === "Visa" ? "5/5e/Visa_Inc._logo.svg" : type === "MasterCard" ? "2/2a/Mastercard-logo.svg" : type === "GCash" ? "1/1e/GCash_logo.png" : ""
              })`,
            }}
          />
        </Col>
      ))}
    </Row>

    {selectedCardType && (
      <Form layout="vertical" style={{ marginTop: "20px" }}>
        <Form.Item
          label="Card Number"
          name="cardNumber"
          rules={[
            { required: true, message: "Please enter card number" },
            { pattern: /^\d{16}$/, message: "Card number must be 16 digits" }
          ]}
        >
          <Input 
            placeholder="Enter 16-digit card number"
            maxLength={16}
            style={{ borderRadius: "6px" }}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Expiry Date"
              name="expiryDate"
              rules={[
                { required: true, message: "Please enter expiry date" },
                { pattern: /^(0[1-9]|1[0-2])\/\d{2}$/, message: "Use MM/YY format" }
              ]}
            >
              <Input 
                placeholder="MM/YY"
                maxLength={5}
                style={{ borderRadius: "6px" }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="CVV"
              name="cvv"
              rules={[
                { required: true, message: "Please enter CVV" },
                { pattern: /^\d{3,4}$/, message: "CVV must be 3 or 4 digits" }
              ]}
            >
              <Input 
                placeholder="Enter CVV"
                maxLength={4}
                type="password"
                style={{ borderRadius: "6px" }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Cardholder Name"
          name="cardholderName"
          rules={[{ required: true, message: "Please enter cardholder name" }]}
        >
          <Input 
            placeholder="Enter cardholder name"
            style={{ borderRadius: "6px" }}
          />
        </Form.Item>
      </Form>
    )}
  </div>
);

export default CardTypeSelector;