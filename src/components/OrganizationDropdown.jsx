import React, { useContext, useEffect, useState, useRef } from "react";
import { Select } from "antd";
import axios from "axios";
import { OrganizationContext } from "../context/OrganizationContext";
import { AuthContext } from "../context/AuthContext";

const { Option } = Select;

const OrganizationDropdown = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { selectedOrganizationId, setSelectedOrganizationId } = useContext(OrganizationContext);
  const { accessToken } = useContext(AuthContext);
  const BASE_URL = process.env.REACT_APP_API_URL;
  const hasSetDefault = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const fetchOrganizations = async () => {
      if (!accessToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
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

        if (!isMounted) return;

        if (!Array.isArray(orgs) || orgs.length === 0) {
          setOrganizations([]);
          setLoading(false);
          return;
        }

        setOrganizations(orgs);

        // Only set default organization if no organization is selected and we haven't set it before
        if (!selectedOrganizationId && orgs.length > 0 && !hasSetDefault.current) {
          setSelectedOrganizationId(orgs[0].id);
          hasSetDefault.current = true;
        }
      } catch (err) {
        console.error("Failed to fetch organizations:", err);
        if (isMounted) setOrganizations([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrganizations();

    return () => {
      isMounted = false;
    };
    
  }, [BASE_URL, accessToken, setSelectedOrganizationId]);

  const handleOrganizationChange = (value) => {
    if (!value) return;
    setSelectedOrganizationId(value);
  };

  if (loading) {
    return (
      <Select
        placeholder="Loading organizations..."
        loading
        style={{ width: 200, height: 43 }}
        disabled
      />
    );
  }

  if (organizations.length === 0) {
    return (
      <Select
        placeholder="No organizations available"
        style={{ width: 200, height: 43 }}
        disabled
      />
    );
  }

  return (
    <Select
      placeholder="Select an organization"
      value={selectedOrganizationId || undefined}
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
