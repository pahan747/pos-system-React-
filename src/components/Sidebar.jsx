import React, { useState, useEffect, useContext } from "react";
import "../assets/css/components/MainStyles.css";
import { Link, useNavigate } from "react-router-dom";
import OtherServicesModal from "./OtherServicesModal";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { OrganizationContext } from "../context/OrganizationContext";

const Sidebar = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [organizationData, setOrganizationData] = useState(null);
  const { selectedOrganizationId } = useContext(OrganizationContext);
  const { accessToken, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const BASE_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchOrganizationData = async () => {
      try {
        if (!accessToken) {
          throw new Error("Access token missing. Please log in.");
        }
        
        if (selectedOrganizationId) {
          console.log('Fetching organization data for ID:', selectedOrganizationId);
          const config = {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          };

          const response = await axios.get(`${BASE_URL}Organization/${selectedOrganizationId}`, config);
          console.log('Organization data received:', response.data);
          setOrganizationData(response.data);
        }
      } catch (error) {
        console.error('Error fetching organization data:', error);
      }
    };

    fetchOrganizationData();
  }, [BASE_URL, selectedOrganizationId, accessToken]);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleClose = () => {
    setIsModalVisible(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="logo-section">
        <img src={organizationData?.image} alt="Logo" className="logo-icon" />
        <h2>{organizationData?.name}</h2>
      </div>
      <ul className="nav-links">
        <li>
          <Link to="/" className="active">
            <i className="fas fa-utensils"></i> Menu
          </Link>
        </li>
        <li>
          <Link to="#" onClick={showModal}>
            <i className="fas fa-table"></i> Other Services
          </Link>
        </li>
        <li>
          <Link to="/orders">
            <i className="fas fa-calendar-alt"></i> Orders
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
      <button className="logout-btn" onClick={handleLogout}>Logout</button>
      <OtherServicesModal visible={isModalVisible} onClose={handleClose} />
    </aside>
  );
};

export default Sidebar; 
