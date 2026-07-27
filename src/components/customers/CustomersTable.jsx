import { useEffect, useMemo, useState } from "react";
import { getCustomers } from "../../services/customers.service";

function CustomersTable({ search, status }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

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

                filteredCustomers.map((customer) => (

                  <tr key={customer.id}>

                    <td>
                      <strong>{customer.name}</strong>
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
                        className="btn btn-sm btn-outline-primary me-2"
                        title="View Customer"
                      >
                        <i className="bi bi-eye"></i>
                      </button>

                      <button
                        className="btn btn-sm btn-outline-success"
                        title="Message Customer"
                      >
                        <i className="bi bi-chat"></i>
                      </button>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default CustomersTable;