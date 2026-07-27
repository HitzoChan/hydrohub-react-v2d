function DeliveryDetails({ delivery, onClose }) {

    const getStatusClass = (status = "") => {

        switch (status.toLowerCase()) {

            case "completed":
            case "delivered":
                return "bg-success";

            case "pending":
                return "bg-warning text-dark";

            case "cancelled":
                return "bg-danger";

            case "in progress":
                return "bg-primary";

            default:
                return "bg-secondary";

        }

    };

    return (

        <div
            className="modal fade"
            id="deliveryDetailsModal"
            tabIndex="-1"
            aria-labelledby="deliveryDetailsModalLabel"
            aria-hidden="true"
        >

            <div className="modal-dialog modal-dialog-centered modal-lg">

                <div className="modal-content border-0 shadow-lg">

                    <div className="modal-header">

                        <div>

                            <h4
                                className="modal-title fw-bold"
                                id="deliveryDetailsModalLabel"
                            >
                                Delivery Details
                            </h4>

                            <small className="text-muted">

                                View complete delivery information.

                            </small>

                        </div>

                        <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="modal"
                            onClick={onClose}
                        ></button>

                    </div>

                    {!delivery ? (

                        <div className="modal-body py-5 text-center">

                            <h5 className="text-muted">

                                No delivery selected.

                            </h5>

                            <p className="text-muted mb-0">

                                Select a delivery from the table to view its details.

                            </p>

                        </div>

                    ) : (

                        <>

                            <div className="modal-body">

                                <div className="row g-4">

                                    <div className="col-md-6">

                                        <div className="detail-row">

                                            <label>Customer</label>

                                            <div>{delivery.customer_name}</div>

                                        </div>

                                    </div>

                                    <div className="col-md-6">

                                        <div className="detail-row">

                                            <label>Driver</label>

                                            <div>

                                                {delivery.driver?.name || "Unassigned"}

                                            </div>

                                        </div>

                                    </div>

                                    <div className="col-md-6">

                                        <div className="detail-row">

                                            <label>Status</label>

                                            <div>

                                                <span className={`badge ${getStatusClass(delivery.status)}`}>

                                                    {delivery.status}

                                                </span>

                                            </div>

                                        </div>

                                    </div>

                                    <div className="col-md-6">

                                        <div className="detail-row">

                                            <label>Scheduled Date</label>

                                            <div>

                                                {delivery.schedule_date || "-"}

                                            </div>

                                        </div>

                                    </div>

                                    <div className="col-12">

                                        <div className="detail-row">

                                            <label>Delivery Address</label>

                                            <div>

                                                {delivery.address || "-"}

                                            </div>

                                        </div>

                                    </div>

                                    <div className="col-md-6">

                                        <div className="detail-row">

                                            <label>Driver Latitude</label>

                                            <div>

                                                {delivery.driver_lat ?? "-"}

                                            </div>

                                        </div>

                                    </div>

                                    <div className="col-md-6">

                                        <div className="detail-row">

                                            <label>Driver Longitude</label>

                                            <div>

                                                {delivery.driver_lng ?? "-"}

                                            </div>

                                        </div>

                                    </div>

                                    <div className="col-md-6">

                                        <div className="detail-row">

                                            <label>Customer Latitude</label>

                                            <div>

                                                {delivery.customer_lat ?? "-"}

                                            </div>

                                        </div>

                                    </div>

                                    <div className="col-md-6">

                                        <div className="detail-row">

                                            <label>Customer Longitude</label>

                                            <div>

                                                {delivery.customer_lng ?? "-"}

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </div>

                            <div className="modal-footer">

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    data-bs-dismiss="modal"
                                    onClick={onClose}
                                >
                                    Close
                                </button>

                            </div>

                        </>

                    )}

                </div>

            </div>

        </div>

    );

}

export default DeliveryDetails;