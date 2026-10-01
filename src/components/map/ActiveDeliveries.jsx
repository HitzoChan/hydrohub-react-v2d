import { useMemo, useState } from "react";

const ITEMS_PER_PAGE = 10;

function ActiveDeliveries({

    deliveries,

    selectedDelivery,

    onSelect,

}) {

    const [search, setSearch] = useState("");

    const [currentPage, setCurrentPage] = useState(1);

    const getStatusClass = (status = "") => {

        switch (status.toLowerCase()) {

            case "completed":
            case "delivered":
                return "bg-success";

            case "pending":
                return "bg-warning";

            case "cancelled":
                return "bg-danger";

            case "in progress":
                return "bg-primary";

            default:
                return "bg-secondary";

        }

    };

    const filteredDeliveries = useMemo(() => {

        return deliveries.filter((delivery) => {

            const customer = delivery.customer_name?.toLowerCase() || "";

            const driver = delivery.driver?.name?.toLowerCase() || "";

            const keyword = search.toLowerCase();

            return (

                customer.includes(keyword) ||

                driver.includes(keyword)

            );

        });

    }, [deliveries, search]);

    const totalPages = Math.max(

        1,

        Math.ceil(filteredDeliveries.length / ITEMS_PER_PAGE)

    );

    const currentDeliveries = filteredDeliveries.slice(

        (currentPage - 1) * ITEMS_PER_PAGE,

        currentPage * ITEMS_PER_PAGE

    );

    const changePage = (page) => {

        if (page < 1 || page > totalPages) return;

        setCurrentPage(page);

    };

    return (

        <div className="card shadow-sm active-deliveries-card">

            <div className="card-header">

                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">

                    <div>

                        <h5 className="mb-1">

                            <i className="bi bi-truck text-primary me-2"></i>

                            Active Deliveries

                        </h5>

                        <small className="text-muted">

                            Monitor all active deliveries.

                        </small>

                    </div>

                    <span className="badge bg-primary rounded-pill px-3">

                        {filteredDeliveries.length}

                    </span>

                </div>

            </div>

            <div className="card-body">

                <div className="mb-3">

                    <div className="input-group">

                        <span className="input-group-text">

                            <i className="bi bi-search"></i>

                        </span>

                        <input

                            type="text"

                            className="form-control"

                            placeholder="Search customer or driver..."

                            value={search}

                            onChange={(e) => {

                                setSearch(e.target.value);

                                setCurrentPage(1);

                            }}

                        />

                    </div>

                </div>

                {currentDeliveries.length === 0 ? (

                    <div className="text-center py-5 text-muted">

                        <i className="bi bi-truck fs-1 d-block mb-3"></i>

                        No deliveries found.

                    </div>

                ) : (

                    <div className="table-responsive">

                        <table className="table align-middle table-hover">

                            <thead>

                                <tr>

                                    <th>Customer</th>

                                    <th>Driver</th>

                                    <th>Status</th>

                                    <th width="120">Action</th>

                                </tr>

                            </thead>

                            <tbody>

                                {currentDeliveries.map((delivery) => (

                                    <tr

                                        key={delivery.id}

                                        className={

                                            selectedDelivery?.id === delivery.id

                                                ? "table-primary"

                                                : ""

                                        }

                                    >

                                        <td>

                                            <strong>

                                                {delivery.customer_name}

                                            </strong>

                                        </td>

                                        <td>

                                            {delivery.driver?.name ||

                                                "Unassigned"}

                                        </td>

                                        <td>

                                            <span

                                                className={`badge ${getStatusClass(

                                                    delivery.status

                                                )}`}

                                            >

                                                {delivery.status}

                                            </span>

                                        </td>

                                        <td>

                                            <button
                                                className="btn btn-sm btn-primary"
                                                data-bs-toggle="modal"
                                                data-bs-target="#deliveryDetailsModal"
                                                onClick={() => onSelect(delivery)}
                                            >
                                                <i className="bi bi-eye me-1"></i>
                                                View
                                            </button>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

            <div className="card-footer bg-white">

                <div className="map-pagination">

                    <button
                        type="button"
                        onClick={() => changePage(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        <i className="bi bi-chevron-left me-1" />
                        Previous
                    </button>

                    <span>
                        Page {currentPage} of {totalPages}
                    </span>

                    <button
                        type="button"
                        onClick={() => changePage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                    >
                        Next
                        <i className="bi bi-chevron-right ms-1" />
                    </button>

                </div>

            </div>

        </div>

    );

}

export default ActiveDeliveries;