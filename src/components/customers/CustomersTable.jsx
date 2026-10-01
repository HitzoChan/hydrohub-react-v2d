import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCustomers } from "../../services/customers.service";
import { createSupportConversation } from "../../services/messaging.service";

const CUSTOMERS_PER_PAGE = 10;

function CustomersTable({ search, status }) {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagingCustomerId, setMessagingCustomerId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let ignore = false;

    async function fetchCustomers() {
      try {
        const data = await getCustomers();

        if (!ignore) {
          setCustomers(data);
        }
      } catch (error) {
        console.error("Failed to load customers:", error);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchCustomers();

    return () => {
      ignore = true;
    };
  }, []);

  // ==========================================
  // FILTER CUSTOMERS
  // ==========================================

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        customer.name.toLowerCase().includes(searchText) ||
        customer.phone.toLowerCase().includes(searchText) ||
        customer.email.toLowerCase().includes(searchText) ||
        customer.address.toLowerCase().includes(searchText);

      const matchesStatus =
        status === "all" || customer.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [customers, search, status]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / CUSTOMERS_PER_PAGE)
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedCustomers = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * CUSTOMERS_PER_PAGE;
    return filteredCustomers.slice(
      startIndex,
      startIndex + CUSTOMERS_PER_PAGE
    );
  }, [filteredCustomers, safeCurrentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, status]);

  async function handleMessageCustomer(customer) {
    if (!customer?.id || messagingCustomerId) {
      return;
    }

    try {
      setMessagingCustomerId(customer.id);

      const conversation = await createSupportConversation(
        customer.id
      );

      navigate("/messaging", {
        state: {
          conversationId: conversation.id,
        },
      });
    } catch (error) {
      console.error("Failed to open customer conversation:", error);
      window.alert("Unable to open customer messaging.");
    } finally {
      setMessagingCustomerId(null);
    }
  }

  return (
    <div className="card shadow-sm border-0">

      <div className="card-header bg-white d-flex justify-content-between align-items-center">

        <h5 className="mb-0">
          All Customers
        </h5>

        <span className="badge bg-primary">
          {filteredCustomers.length} Customers
        </span>

      </div>

      <div className="card-body">

        <div className="table-responsive">

          <table className="table align-middle">

            <thead>

              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th>Orders</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-5"
                  >
                    Loading customers...
                  </td>
                </tr>

              ) : filteredCustomers.length === 0 ? (

                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-5"
                  >
                    No customers found.
                  </td>
                </tr>

              ) : (

                paginatedCustomers.map((customer) => (

                  <tr key={customer.id}>

                    <td>
                      <div className="customer-name-cell">
                        <span className="customer-profile-avatar">
                          {customer.name?.charAt(0)?.toUpperCase()}
                          {customer.avatar_url && (
                            <img
                              src={customer.avatar_url}
                              alt={`${customer.name} profile`}
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                        </span>
                        <strong>{customer.name}</strong>
                      </div>
                    </td>

                    <td>{customer.phone}</td>

                    <td>{customer.email}</td>

                    <td>{customer.address}</td>

                    <td>
                      <span className="badge bg-info">
                        {customer.orders}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          customer.status === "Active"
                            ? "bg-success"
                            : "bg-secondary"
                        }`}
                      >
                        {customer.status}
                      </span>
                    </td>

                    <td className="text-end">

                      <button
                        className="btn btn-sm btn-outline-success"
                        title="Message Customer"
                        onClick={() =>
                          handleMessageCustomer(customer)
                        }
                        disabled={messagingCustomerId === customer.id}
                      >
                        <i
                          className={`bi ${
                            messagingCustomerId === customer.id
                              ? "bi-hourglass-split"
                              : "bi-chat"
                          }`}
                        ></i>
                      </button>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

        {!loading && filteredCustomers.length > 0 && (
          <div className="customer-pagination">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safeCurrentPage === 1}
            >
              <i className="bi bi-chevron-left me-1" />
              Previous
            </button>

            <span>
              Page {safeCurrentPage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              disabled={safeCurrentPage >= totalPages}
            >
              Next
              <i className="bi bi-chevron-right ms-1" />
            </button>
          </div>
        )}

      </div>

    </div>
  );
}

export default CustomersTable;