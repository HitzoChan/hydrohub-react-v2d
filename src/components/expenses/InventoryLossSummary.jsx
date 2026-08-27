function InventoryLossSummary({
    totalContainers = 0,
    withCustomers = 0,
    withDrivers = 0,
    missing = 0,
    damaged = 0,
}) {

    return (
        <section className="inventory-loss-section">

            <div className="expense-section-heading">

                <div>

                    <span className="expense-section-eyebrow">
                        CONTAINER ACCOUNTABILITY
                    </span>

                    <h2>
                        Gallon Inventory Loss
                    </h2>

                    <p>
                        Monitor the location and
                        condition of water containers.
                    </p>

                </div>

            </div>


            <div className="inventory-loss-grid">


                <div className="inventory-loss-card total">

                    <div className="inventory-loss-card-top">

                        <span>
                            Total Containers
                        </span>

                        <div>
                            📦
                        </div>

                    </div>

                    <strong>
                        {totalContainers}
                    </strong>

                    <small>
                        Containers owned
                    </small>

                </div>


                <div className="inventory-loss-card customer">

                    <div className="inventory-loss-card-top">

                        <span>
                            With Customers
                        </span>

                        <div>
                            👤
                        </div>

                    </div>

                    <strong>
                        {withCustomers}
                    </strong>

                    <small>
                        Currently circulating
                    </small>

                </div>


                <div className="inventory-loss-card driver">

                    <div className="inventory-loss-card-top">

                        <span>
                            With Drivers
                        </span>

                        <div>
                            🚚
                        </div>

                    </div>

                    <strong>
                        {withDrivers}
                    </strong>

                    <small>
                        Assigned to delivery
                    </small>

                </div>


                <div className="inventory-loss-card missing">

                    <div className="inventory-loss-card-top">

                        <span>
                            Missing
                        </span>

                        <div>
                            !
                        </div>

                    </div>

                    <strong>
                        {missing}
                    </strong>

                    <small>
                        Containers unaccounted for
                    </small>

                </div>


                <div className="inventory-loss-card damaged">

                    <div className="inventory-loss-card-top">

                        <span>
                            Damaged
                        </span>

                        <div>
                            ⚠
                        </div>

                    </div>

                    <strong>
                        {damaged}
                    </strong>

                    <small>
                        Containers reported damaged
                    </small>

                </div>


            </div>


            <div className="inventory-loss-notice">

                <div className="inventory-loss-notice-icon">
                    i
                </div>

                <div>

                    <strong>
                        Inventory loss is reported separately
                        from operating expenses.
                    </strong>

                    <p>
                        Missing and damaged gallons are
                        container-accountability metrics.
                        They should only affect financial
                        expenses when an actual replacement
                        or repair cost is recorded.
                    </p>

                </div>

            </div>

        </section>
    );
}


export default InventoryLossSummary;