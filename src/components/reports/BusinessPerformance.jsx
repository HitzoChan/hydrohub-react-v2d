import { formatCurrency } from "../../services/reports.service";

export default function BusinessPerformance({
    financial = {},
}) {
    const revenue =
        Number(
            financial.revenue
        ) || 0;

    const expenses =
        Number(
            financial.expenses
        ) || 0;

    const netProfit =
        Number(
            financial.netProfit
        ) || 0;

    const profitMargin =
        Number(
            financial.profitMargin
        ) || 0;

    return (
        <>
            <h6 className="mb-3 text-secondary">
                Business Performance
            </h6>

            <div className="row g-3 mb-4">

                <div className="col-md-3">

                    <div className="stat-card">

                        <small className="text-muted">
                            Total Revenue
                        </small>

                        <h5 className="mt-1 mb-0">
                            {formatCurrency(
                                revenue
                            )}
                        </h5>

                    </div>

                </div>


                <div className="col-md-3">

                    <div className="stat-card">

                        <small className="text-muted">
                            Total Expenses
                        </small>

                        <h5 className="mt-1 mb-0">
                            {formatCurrency(
                                expenses
                            )}
                        </h5>

                    </div>

                </div>


                <div className="col-md-3">

                    <div className="stat-card">

                        <small className="text-muted">
                            Net Profit
                        </small>

                        <h5 className="mt-1 mb-0">
                            {formatCurrency(
                                netProfit
                            )}
                        </h5>

                    </div>

                </div>


                <div className="col-md-3">

                    <div className="stat-card">

                        <small className="text-muted">
                            Profit Margin
                        </small>

                        <h5 className="mt-1 mb-0">
                            {profitMargin.toFixed(
                                1
                            )}
                            %
                        </h5>

                    </div>

                </div>

            </div>
        </>
    );
}