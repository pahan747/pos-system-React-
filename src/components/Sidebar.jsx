import React, { useState } from "react";
import "./styles.css";
import { Link } from "react-router-dom";
import OtherServicesModal from "./OtherServicesModal";

const Sidebar = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleClose = () => {
    setIsModalVisible(false);
  };

  return (
    <aside className="sidebar">
      <div className="logo-section">
        <img src="food.webp" alt="Logo" className="logo-icon" />
        <h2>CHILI POS</h2>
      </div>
      <ul className="nav-links">
        <li>
          <Link to="#" className="active">
            <i className="fas fa-utensils"></i> Menu
          </Link>
        </li>
        <li>
          <Link to="#" onClick={showModal}>
            <i className="fas fa-table"></i> Other Services
          </Link>
        </li>
        <li>
          <Link to="#">
            <i className="fas fa-calendar-alt"></i> Reservation
          </Link>
        </li>
        <li>
          <Link to="#">
            <i className="fas fa-shipping-fast"></i> Delivery
          </Link>
        </li>
        <li>
          <Link to="#">
            <i className="fas fa-calculator"></i> Accounting
          </Link>
        </li>
        <li>
          <Link to="#">
            <i className="fas fa-cog"></i> Settings
          </Link>
        </li>
      </ul>
      <div className="user-section">
        <div className="user">
          <span className="user-initials">FM</span>
          <p>Floyd Miles</p>
        </div>
        <div className="user">
          <span className="user-initials">AM</span>
          <p>Arlene McCoy</p>
        </div>
      </div>
      <button className="logout-btn">Logout</button>
      <OtherServicesModal visible={isModalVisible} onClose={handleClose} />
    </aside>
  );
};

export default Sidebar;
