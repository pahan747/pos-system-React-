import React from "react";
import { Modal, Row } from "antd";

const PaymentModal = ({ title, visible, onCancel, children, footer }) => (
  <Modal
    title={<span style={{ fontSize: "20px", fontWeight: "bold" }}>{title}</span>}
    open={visible}
    onCancel={onCancel}
    width={650}
    style={{ minHeight: "450px", borderRadius: "8px" }}
    styles={{ padding: "24px", background: "#f9f9f9" }}
    footer={footer}
  >
    <Row gutter={[24, 24]} style={{ alignItems: "stretch" }}>{children}</Row>
  </Modal>
);

export default PaymentModal;