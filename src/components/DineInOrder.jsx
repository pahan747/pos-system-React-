import React from 'react';
import { Input } from 'antd';

const DineInOrder = ({ 
  cartData, 
  onQuantityDecrease, 
  onQuantityIncrease, 
  onNoteChange, 
  onAddNote 
}) => {
  return (
    <div className="dine-in-section">
      <div className="order-items">
        {cartData?.cartDetails?.length > 0 ? (
          cartData.cartDetails.map((item, index) => (
            <div key={index} className="order-item">
              <img src={item.image} alt={item.name} />
              <div className="order-details">
                <h4>{item.name}</h4>
                <div className="order-price">
                  <span>${(item.price || 0).toFixed(2)}</span>
                  <div className="quantity-controls">
                    <button 
                      className="qty-btn decrease" 
                      disabled={item.qty <= 1 || item.isKot !== 0}
                      onClick={() => onQuantityDecrease(index)}
                    >
                      -
                    </button>
                    <span>{item.qty}x</span>
                    <button 
                      className="qty-btn increase"
                      disabled={item.isKot !== 0}
                      onClick={() => onQuantityIncrease(index)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="input-container">
                  <Input
                    placeholder="Add notes"
                    value={item.note || ""} 
                    onChange={(e) => onNoteChange(index, e.target.value)}
                    disabled={item.isKot !== 0}
                    style={{ marginTop: "8px", width: "calc(100% - 80px)" }}
                  />
                  <button
                    className="add-note-btn"
                    onClick={() => onAddNote(index)}
                    disabled={item.isKot !== 0}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No items in Dine In cart</p>
        )}
      </div>

      {cartData && (
        <div className="totals">
          <p>SubTotal: <span>${(cartData.subTotal || 0).toFixed(2)}</span></p>
          <p>Tax: <span>${(cartData.tax || 0).toFixed(2)}</span></p>
          <p>Service: <span>${(cartData.service || 0).toFixed(2)}</span></p>
          {(cartData.discount || 0) > 0 && (
            <p>Discount: <span>-${(cartData.discount || 0).toFixed(2)}</span></p>
          )}
          <h3>Total: <span>${(cartData.subTotal || 0).toFixed(2)}</span></h3>
        </div>
      )}
    </div>
  );
};

export default DineInOrder; 