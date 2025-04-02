import React from "react";
import { Row, Col, Button } from "antd";

const PaymentKeypad = ({ handleKeypadClick }) => {
  const keypadButtons = [1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "OK"];

  return (
    <Row gutter={[12, 12]}>
      {keypadButtons.map((num) => (
        <Col span={8} key={num}>
          <Button
            onClick={() => handleKeypadClick(num.toString())}
            style={{
              width: "100%",
              height: "50px",
              fontSize: "18px",
              borderRadius: "6px",
              background: num === "OK" ? "#52c41a" : "#f0f0f0",
              color: num === "OK" ? "white" : "#000",
              border: "none",
            }}
          >
            {num}
          </Button>
        </Col>
      ))}
    </Row>
  );
};

export default PaymentKeypad;