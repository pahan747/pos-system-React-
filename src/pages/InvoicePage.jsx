import React, { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import OrganizationDropdown from "../components/OrganizationDropdown";
import InvoiceTable from "../components/InvoiceTable";
import { AuthContext } from "../context/AuthContext";

const formatDateForComparison = (dateString) => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
};

const InvoicePage = () => {
  const { accessToken } = useContext(AuthContext);
  const [invoices, setInvoices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const BASE_URL = process.env.REACT_APP_API_URL;

  const fetchInvoices = useCallback(async () => {
    try {
      if (!accessToken) throw new Error("Access token missing. Please log in.");
      setLoading(true);
      setError(null);

      const config = {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      };

      const response = await axios.get(
        `${BASE_URL}Invoice/get-invoice-list`,
        config
      );

      // Transform the response data with additional date fields for filtering
      const transformedInvoices = response.data.map((invoice) => ({
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName || "N/A", // Handle null values
        issueDate: new Date(invoice.createUtc).toLocaleDateString(), // Format date for display
        issueDateForComparison: formatDateForComparison(invoice.createUtc), // For filtering
        dueDate: new Date(invoice.dueDate).toLocaleDateString(), // Format date for display
        dueDateForComparison: formatDateForComparison(invoice.dueDate), // For filtering
        totalAmount: `$${invoice.total.toFixed(2)}`, // Format amount
        status: invoice.status === 0 ? "Unpaid" : "Paid", // Map status
        paymentType: invoice.paymentType,
        noOfItems: invoice.noOfItems,
      }));

      setInvoices(transformedInvoices);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setError(err.response?.data?.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [accessToken, BASE_URL]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filteredInvoices = invoices.filter((invoice) => {
    // Text search filter
    const searchMatch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const statusMatch = statusFilter ? invoice.status === statusFilter : true;
    
    // Date filters using the normalized YYYY-MM-DD strings for comparison
    const formattedStartDate = startDateFilter ? formatDateForComparison(startDateFilter) : '';
    const formattedEndDate = endDateFilter ? formatDateForComparison(endDateFilter) : '';
    
    const startDateMatch = formattedStartDate
      ? invoice.issueDateForComparison >= formattedStartDate
      : true;
    
    const endDateMatch = formattedEndDate
      ? invoice.dueDateForComparison <= formattedEndDate
      : true;
    
    return searchMatch && statusMatch && startDateMatch && endDateMatch;
  });

  const totalPages = Math.ceil(filteredInvoices.length / 10);

  return (
    <div className="container-invoice">
      <Sidebar />
      <main className="main-content">
        <div className="dropdown-container">
          <h1>Orders</h1>
          <OrganizationDropdown />
        </div>
        {loading ? (
          <p>Loading invoices...</p>
        ) : error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : (
          <InvoiceTable
            invoices={filteredInvoices}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            startDateFilter={startDateFilter}
            onStartDateFilterChange={setStartDateFilter}
            endDateFilter={endDateFilter}
            onEndDateFilterChange={setEndDateFilter}
          />
        )}
      </main>
    </div>
  );
};

export default InvoicePage;