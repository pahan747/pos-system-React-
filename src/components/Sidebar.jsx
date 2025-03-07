import React from 'react';
import './styles.css'; 

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="logo-section">
        <img src="food.webp" alt="Logo" className="logo-icon" />
        <h2>CHILI POS</h2>
      </div>
      <ul className="nav-links">
        <li><a href="#" className="active"><i className="fas fa-utensils"></i> Menu</a></li>
        <li><a href="#"><i className="fas fa-table"></i> Table Services</a></li>
        <li><a href="#"><i className="fas fa-calendar-alt"></i> Reservation</a></li>
        <li><a href="#"><i className="fas fa-shipping-fast"></i> Delivery</a></li>
        <li><a href="#"><i className="fas fa-calculator"></i> Accounting</a></li>
        <li><a href="#"><i className="fas fa-cog"></i> Settings</a></li>
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
    </aside>
  );
};

export default Sidebar;
