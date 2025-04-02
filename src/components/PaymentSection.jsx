import React from 'react';
import { Button } from 'antd';

const PaymentSection = ({ 
  selectedPayment,
  onPaymentSelect,
  onPlaceOrder,
  onFinishOrder,
  serviceType
}) => {
  return (
    <div className="payment-section">
      <div className="payment-options">
        {["Cash", "Card", "QR"].map((method) => (
          <button
            key={method}
            className={`payment-btn ${selectedPayment === method ? "active" : ""}`}
            onClick={() => onPaymentSelect(method)}
          >
            <i
              className={`fas fa-${
                method === "Cash" ? "money-bill-wave" : method === "Card" ? "credit-card" : "qrcode"
              }`}
            ></i>{" "}
            {method === "Card" ? "Credit/Debit Card" : method}
          </button>
        ))}
      </div>

      <button className="place-order-btn" onClick={onPlaceOrder}>
        Place {serviceType} Order
      </button>

      <button className="finish-order-btn" onClick={onFinishOrder}>
        Finish {serviceType} Order
      </button>
    </div>
  );
};

export default PaymentSection; 