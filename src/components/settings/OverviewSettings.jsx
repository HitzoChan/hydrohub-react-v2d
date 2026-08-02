import {
    Droplet,
    Truck,
    CreditCard,
    People
} from "react-bootstrap-icons";

export default function OverviewSettings({ settings }) {

    return (

        <div className="row g-4">

            {/* Products */}

            <div className="col-lg-6">

                <div className="card shadow-sm border-0 rounded-4 h-100">

                    <div className="card-body p-4">

                        <div className="d-flex align-items-center">

                            <div
                                className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center me-3"
                                style={{
                                    width: "68px",
                                    height: "68px"
                                }}
                            >

                                <Droplet
                                    size={30}
                                    className="text-primary"
                                />

                            </div>

                            <div>

                                <small className="text-muted d-block mb-1">

                                    Product Management

                                </small>

                                <h3
                                    className="fw-bold mb-0"
                                    style={{
                                        fontSize: "2rem",
                                        lineHeight: "1.15"
                                    }}
                                >

                                    Products

                                </h3>

                            </div>

                        </div>

                        <hr className="my-2" />

                        <p
                            className="text-muted mb-0"
                            style={{
                                fontSize: ".95rem",
                                lineHeight:"1.1"
                            }}
                        >

                            Add, edit, enable, or disable products available
                            for ordering.

                        </p>

                    </div>

                </div>

            </div>

            {/* Delivery */}

            <div className="col-lg-6">

                <div className="card shadow-sm border-0 rounded-4 h-100">

                    <div className="card-body p-4">

                        <div className="d-flex align-items-center">

                            <div
                                className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center me-3"
                                style={{
                                    width: "68px",
                                    height: "68px"
                                }}
                            >

                                <Truck
                                    size={30}
                                    className="text-success"
                                />

                            </div>

                            <div>

                                <small className="text-muted d-block">

                                    Delivery

                                </small>

                                <h2
                                    className="fw-bold mb-1"
                                    style={{
                                        fontSize: "2.2rem"
                                    }}
                                >

                                    {settings.maxDeliveries}

                                </h2>

                                <small className="text-muted">

                                    Max Deliveries per Driver

                                </small>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

            {/* Payment */}

            <div className="col-lg-6">

                <div className="card shadow-sm border-0 rounded-4 h-100">

                    <div className="card-body p-4">

                        <div className="d-flex align-items-center">

                            <div
                                className="rounded-circle bg-warning bg-opacity-10 d-flex align-items-center justify-content-center me-3"
                                style={{
                                    width: "68px",
                                    height: "68px"
                                }}
                            >

                                <CreditCard
                                    size={30}
                                    className="text-warning"
                                />

                            </div>

                            <div>

                                <small className="text-muted d-block">

                                    Payment

                                </small>

                                <h3
                                    className="fw-bold mb-0"
                                    style={{
                                        fontSize: "2rem"
                                    }}
                                >

                                    {settings.codEnabled
                                        ? "Cash on Delivery"
                                        : "Disabled"}

                                </h3>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

            {/* Employee */}

            <div className="col-lg-6">

                <div className="card shadow-sm border-0 rounded-4 h-100">

                    <div className="card-body p-4">

                        <div className="d-flex align-items-center">

                            <div
                                className="rounded-circle bg-info bg-opacity-10 d-flex align-items-center justify-content-center me-3"
                                style={{
                                    width: "68px",
                                    height: "68px"
                                }}
                            >

                                <People
                                    size={30}
                                    className="text-info"
                                />

                            </div>

                            <div>

                                <small className="text-muted d-block">

                                    Employee Access

                                </small>

                                <h2
                                    className="fw-bold mb-1"
                                    style={{
                                        fontSize: "2.2rem"
                                    }}
                                >

                                    {settings.codeLength} Digits

                                </h2>

                                <small className="text-muted">

                                    Access Code Length

                                </small>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}