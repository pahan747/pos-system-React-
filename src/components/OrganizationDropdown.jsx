import React, { useContext, useEffect, useState } from "react";
import { Select } from "antd";
import axios from "axios";
import { OrganizationContext } from "../context/OrganizationContext";
import { AuthContext } from "../context/AuthContext";

const { Option } = Select;

const OrganizationDropdown = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { selectedOrganizationId, setSelectedOrganizationId } =
    useContext(OrganizationContext);
  const { accessToken } = useContext(AuthContext);
  const BASE_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        if (!accessToken) {
          throw new Error("Access token missing. Please log in.");
        }
        const config = {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        };
        const response = await axios.get(
          `${BASE_URL}Organization/GetAll-organizations`,
          config
        );
        const orgs = response.data;
        setOrganizations(orgs);

        const savedOrganizationId = localStorage.getItem(
          "selectedOrganizationId"
        );

        if (
          savedOrganizationId &&
          orgs.some((org) => org.id === savedOrganizationId)
        ) {
          setSelectedOrganizationId(savedOrganizationId);
        } else {
          const defaultOrgId = orgs[0]?.id;
          if (defaultOrgId) {
            localStorage.setItem("selectedOrganizationId", defaultOrgId);
            setSelectedOrganizationId(defaultOrgId);
          }
        }
      } catch (err) {
        console.error("Failed to fetch organizations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrganizations();
  }, [BASE_URL, accessToken, setSelectedOrganizationId]);

  const handleOrganizationChange = (value) => {
    localStorage.setItem("selectedOrganizationId", value);
    setSelectedOrganizationId(value);
  };

  if (loading) {
    return (
      <Select
        placeholder="Loading organizations..."
        loading
        style={{ width: 200, height: 43 }}
      />
    );
  }

  if (!selectedOrganizationId && organizations.length > 0) {
    const defaultOrgId = organizations[0].id;
    localStorage.setItem("selectedOrganizationId", defaultOrgId);
    setSelectedOrganizationId(defaultOrgId);
  }

  return (
    <Select
      placeholder="Select an organization"
      value={selectedOrganizationId}
      onChange={handleOrganizationChange}
      style={{ width: 200, height: 43 }}
    >
      {organizations.map((org) => (
        <Option key={org.id} value={org.id}>
          {org.name}
        </Option>
      ))}
    </Select>
  );
};

export default OrganizationDropdown;
