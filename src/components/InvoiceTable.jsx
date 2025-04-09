import React from "react";

const InvoiceTable = ({
  invoices,
  currentPage,
  totalPages,
  onPageChange,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  startDateFilter,
  onStartDateFilterChange,
  endDateFilter,
  onEndDateFilterChange,
}) => {
  // Changed from 5 to 10 invoices per page
  const invoicesPerPage = 10;

  // Calculate total pages based on the actual invoices length
  const calculatedTotalPages = Math.ceil(invoices.length / invoicesPerPage);

  // Use calculated total pages if totalPages prop is not provided
  const effectiveTotalPages = totalPages || calculatedTotalPages;

  // Calculate proper indices for slicing (adjusted for 10 items per page)
  const indexOfLastInvoice = currentPage * invoicesPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;
  const currentInvoices = invoices.slice(
    indexOfFirstInvoice,
    indexOfLastInvoice
  );

  const headerBgColor = "#28a745";
  const headerTextColor = "white";
  const borderColor = "#e0e0e0";
  const buttonColor = "#5a6acf"; // Blue color that matches the aesthetic

  return (
    <div
      style={{
        width: "100%",
        fontFamily: "Arial, sans-serif",
        margin: "0 auto",
        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.1)",
        border: `1px solid ${borderColor}`,
        marginBottom: "50px",
        borderRadius: "4px",
        overflow: "hidden",
      }}
    >
      {/* Filters - Positioned as a toolbar above the table */}
      <div
        style={{
          padding: "15px",
          backgroundColor: "#f9f9f9",
          borderBottom: `1px solid ${borderColor}`,
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          overflowX: "auto",
          whiteSpace: "nowrap",
        }}
      >
        <input
          type="text"
          placeholder="Search invoices..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            padding: "8px 12px",
            border: `1px solid ${borderColor}`,
            borderRadius: "4px",
            flex: "1 1 200px",
            fontSize: "14px",
            minWidth: "200px",
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          style={{
            padding: "8px 12px",
            border: `1px solid ${borderColor}`,
            borderRadius: "4px",
            flex: "1 1 150px",
            fontSize: "14px",
            minWidth: "150px",
          }}
        >
          <option value="">All Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Overdue">Overdue</option>
        </select>
        <input
          type="date"
          value={startDateFilter}
          onChange={(e) => onStartDateFilterChange(e.target.value)}
          style={{
            padding: "8px 12px",
            border: `1px solid ${borderColor}`,
            borderRadius: "4px",
            flex: "1 1 150px",
            fontSize: "14px",
            minWidth: "150px",
          }}
        />
        <input
          type="date"
          value={endDateFilter}
          onChange={(e) => onEndDateFilterChange(e.target.value)}
          style={{
            padding: "8px 12px",
            border: `1px solid ${borderColor}`,
            borderRadius: "4px",
            flex: "1 1 150px",
            fontSize: "14px",
            minWidth: "150px",
          }}
        />
      </div>

      {/* Table container with horizontal scroll */}
      <div style={{ overflowX: "auto" }}>
        {/* Table with fixed width columns for consistency */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
            minWidth: "1100px",
          }}
        >
          <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
            <tr>
              <th
                style={{
                  backgroundColor: headerBgColor,
                  color: headerTextColor,
                  padding: "12px 15px",
                  fontWeight: "normal",
                  fontSize: "14px",
                  width: "10%",
                }}
              >
                Invoice #
              </th>
              <th
                style={{
                  backgroundColor: headerBgColor,
                  color: headerTextColor,
                  padding: "12px 15px",
                  fontWeight: "normal",
                  fontSize: "14px",
                  width: "15%",
                }}
              >
                Customer
              </th>
              <th
                style={{
                  backgroundColor: headerBgColor,
                  color: headerTextColor,
                  padding: "12px 15px",
                  fontWeight: "normal",
                  fontSize: "14px",
                  width: "12%",
                }}
              >
                Issue Date
              </th>
              <th
                style={{
                  backgroundColor: headerBgColor,
                  color: headerTextColor,
                  padding: "12px 15px",
                  fontWeight: "normal",
                  fontSize: "14px",
                  width: "12%",
                }}
              >
                Due Date
              </th>
              <th
                style={{
                  backgroundColor: headerBgColor,
                  color: headerTextColor,
                  padding: "12px 15px",
                  fontWeight: "normal",
                  fontSize: "14px",
                  width: "12%",
                }}
              >
                Amount
              </th>
              <th
                style={{
                  backgroundColor: headerBgColor,
                  color: headerTextColor,
                  padding: "12px 15px",
                  fontWeight: "normal",
                  fontSize: "14px",
                  width: "12%",
                }}
              >
                No of Items
              </th>
              <th
                style={{
                  backgroundColor: headerBgColor,
                  color: headerTextColor,
                  padding: "12px 15px",
                  fontWeight: "normal",
                  fontSize: "14px",
                  width: "12%",
                }}
              >
                Status
              </th>
              <th
                style={{
                  backgroundColor: headerBgColor,
                  color: headerTextColor,
                  padding: "12px 15px",
                  fontWeight: "normal",
                  fontSize: "14px",
                  width: "12%",
                }}
              >
                Payment Method
              </th>
              <th
                style={{
                  backgroundColor: headerBgColor,
                  color: headerTextColor,
                  padding: "12px 15px",
                  fontWeight: "normal",
                  fontSize: "14px",
                  width: "15%",
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {currentInvoices.length > 0 ? (
              currentInvoices.map((invoice, index) => (
                <tr
                  key={invoice.invoiceNumber}
                  style={{
                    backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f8f8",
                  }}
                >
                  <td
                    style={{
                      padding: "12px 15px",
                      borderBottom: `1px solid ${borderColor}`,
                      color: "#666",
                      fontSize: "14px",
                    }}
                  >
                    {invoice.invoiceNumber}
                  </td>
                  <td
                    style={{
                      padding: "12px 15px",
                      borderBottom: `1px solid ${borderColor}`,
                      color: "#444",
                      fontWeight: "500",
                      fontSize: "14px",
                    }}
                  >
                    {invoice.customerName}
                  </td>
                  <td
                    style={{
                      padding: "12px 15px",
                      borderBottom: `1px solid ${borderColor}`,
                      color: "#666",
                      fontSize: "14px",
                    }}
                  >
                    {invoice.issueDate}
                  </td>
                  <td
                    style={{
                      padding: "12px 15px",
                      borderBottom: `1px solid ${borderColor}`,
                      color: "#666",
                      fontSize: "14px",
                    }}
                  >
                    {invoice.dueDate}
                  </td>
                  <td
                    style={{
                      padding: "12px 15px",
                      borderBottom: `1px solid ${borderColor}`,
                      color: "#666",
                      fontSize: "14px",
                    }}
                  >
                    {invoice.totalAmount}
                  </td>
                  <td
                    style={{
                      padding: "12px 15px",
                      borderBottom: `1px solid ${borderColor}`,
                      color: "#666",
                      fontSize: "14px",
                    }}
                  >
                    {invoice.noOfItems}
                  </td>
                  <td
                    style={{
                      padding: "12px 15px",
                      borderBottom: `1px solid ${borderColor}`,
                      fontSize: "14px",
                    }}
                  >
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        backgroundColor:
                          invoice.status === "Paid"
                            ? "#dff5e5"
                            : invoice.status === "Unpaid"
                            ? "#fcf2d6"
                            : "#fbe7e7",
                        color:
                          invoice.status === "Paid"
                            ? "#2e7d32"
                            : invoice.status === "Unpaid"
                            ? "#ed6c02"
                            : "#d32f2f",
                      }}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "12px 15px",
                      borderBottom: `1px solid ${borderColor}`,
                      color: "#666",
                      fontSize: "14px",
                    }}
                  >
                    {invoice.paymentType}
                  </td>
                  <td
                    style={{
                      padding: "12px 15px",
                      borderBottom: `1px solid ${borderColor}`,
                      fontSize: "14px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <button
                      style={{
                        padding: "6px 12px",
                        backgroundColor: buttonColor,
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "13px",
                        marginRight: "8px",
                      }}
                    >
                      View
                    </button>
                    <button
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "white",
                        color: buttonColor,
                        border: `1px solid ${buttonColor}`,
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "13px",
                      }}
                    >
                      Print
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="9"
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#666",
                    fontSize: "14px",
                    borderBottom: `1px solid ${borderColor}`,
                  }}
                >
                  No invoices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination - Now styled similar to the schedule UI */}
      <div
        style={{
          padding: "15px",
          textAlign: "center",
          backgroundColor: "#f9f9f9",
          borderTop: `1px solid ${borderColor}`,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={{
            padding: "6px 12px",
            border: `1px solid ${borderColor}`,
            borderRadius: "4px",
            backgroundColor: currentPage <= 1 ? "#f0f0f0" : "white",
            color: currentPage <= 1 ? "#999" : "#333",
            cursor: currentPage <= 1 ? "default" : "pointer",
            fontSize: "13px",
          }}
        >
          Previous
        </button>
        <span
          style={{
            margin: "0 10px",
            fontSize: "14px",
            color: "#555",
          }}
        >
          {`Page ${currentPage} of ${effectiveTotalPages || 1}`}
        </span>
        <button
          disabled={currentPage >= effectiveTotalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={{
            padding: "6px 12px",
            border: `1px solid ${borderColor}`,
            borderRadius: "4px",
            backgroundColor:
              currentPage >= effectiveTotalPages ? "#f0f0f0" : "white",
            color: currentPage >= effectiveTotalPages ? "#999" : "#333",
            cursor: currentPage >= effectiveTotalPages ? "default" : "pointer",
            fontSize: "13px",
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default InvoiceTable;
