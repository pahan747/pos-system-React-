import React from "react";
import { Row, Col, Button } from "antd";

const CardTypeSelector = ({ selectedCardType, setSelectedCardType }) => (
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
              type === "Visa" ? "5/5e/Visa_Inc._logo.svg" : type === "MasterCard" ? "2/2a/Mastercard-logo.svg" : "1/1e/GCash_logo.png"
            })`,
          }}
        />
      </Col>
    ))}
  </Row>
);

export default CardTypeSelector;