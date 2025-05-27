import React from "react";
import { Row, Col, Typography, Input, Divider } from "antd";

const { Title, Text } = Typography;

const ReceiptDetails = ({
  cartData,
  discount,
  setDiscount,
  amountEntered,
  calculateDiscountedTotal,
  calculateBalance,
  showAmountFields = true,
}) => {
  // Calculate discount amount
  const discountAmount = (parseFloat(cartData?.subTotal || 0) * (parseFloat(discount) || 0) / 100).toFixed(2);

  return (
    <div
      style={{
        background: "#fff",
        padding: "16px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        height: "100%",
      }}
    >
      <Title level={4} style={{ color: "#52c41a", marginBottom: "16px" }}>
        Receipt Details
      </Title>
      <Row gutter={[8, 12]}>
        <Col span={12}><Text>SubTotal:</Text></Col>
        <Col span={12}><Text strong>RM {(cartData?.subTotal || 0).toFixed(2)}</Text></Col>
      </Row>
      <Row gutter={[8, 12]}>
        <Col span={12}><Text>Tax (5%):</Text></Col>
        <Col span={12}><Text>RM {(cartData?.tax || 0).toFixed(2)}</Text></Col>
      </Row>
      <Row gutter={[8, 12]}>
        <Col span={12}><Text>Discount:</Text></Col>
        <Col span={12}>
          <Input
            value={discount}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*$/.test(value) && (value === "" || (parseFloat(value) >= 0 && parseFloat(value) <= 100)))
                setDiscount(value);
            }}
            suffix="%"
            style={{ width: "90px", borderRadius: "4px" }}
          />
        </Col>
      </Row>
      <Row gutter={[8, 12]}>
        <Col span={12}><Text>Discount Amount:</Text></Col>
        <Col span={12}><Text style={{ color: "#ff4d4f" }}>RM {discountAmount}</Text></Col>
      </Row>
      <Divider style={{ margin: "12px 0" }} />
      <Row gutter={[8, 12]}>
        <Col span={12}><Text strong>Total (After Discount):</Text></Col>
        <Col span={12}>
          <Text strong style={{ color: "#52c41a", fontSize: "18px" }}>
            RM {calculateDiscountedTotal()}
          </Text>
        </Col>
      </Row>
      {showAmountFields && (
        <>
          <Row gutter={[8, 12]}>
            <Col span={12}><Text>Amount Entered:</Text></Col>
            <Col span={12}><Text strong>RM {amountEntered}</Text></Col>
          </Row>
          <Row gutter={[8, 12]}>
            <Col span={12}><Text>Balance:</Text></Col>
            <Col span={12}>
              <Text
                style={{
                  color: calculateBalance() >= 0 ? "#52c41a" : "#ff4d4f",
                  fontWeight: "bold",
                }}
              >
                RM {calculateBalance()}
              </Text>
            </Col>
          </Row>
        </>
      )}
      {showAmountFields && parseFloat(amountEntered) >= parseFloat(calculateDiscountedTotal()) && (
        <Text style={{ color: "#52c41a", display: "block", marginTop: "12px" }}>
          Thank you for your purchase! Visit again soon.
        </Text>
      )}
    </div>
  );
};

export default ReceiptDetails;