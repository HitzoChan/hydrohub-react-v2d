import { formatCurrency } from "../../services/reports.service";

function formatNumber(value) {
    return new Intl.NumberFormat("en-PH", {
        maximumFractionDigits: 1,
    }).format(Number(value) || 0);
}

function formatDeliveryType(type) {
    const normalized = String(type || "").trim().toLowerCase();

    if (["pickup", "pick-up", "pick up"].includes(normalized)) return "Pick-up";
    if (["delivery", "deliver"].includes(normalized)) return "Delivery";
    if (normalized === "now") return "Deliver Now";
    if (normalized === "scheduled") return "Scheduled";

    return normalized
        ? normalized.replace(/\b\w/g, (character) => character.toUpperCase())
        : "Other";
}

function SectionHeading({ number, title, description }) {
    return (
        <div className="report-focus-heading">
            <span>{number}</span>
            <div>
                <h2>{title}</h2>
                <p>{description}</p>
            </div>
        </div>
    );
}

function FocusCard({ title, description, children, className = "" }) {
    return (
        <section className={`report-focus-card ${className}`}>
            <header>
                <h3>{title}</h3>
                {description && <p>{description}</p>}
            </header>
            {children}
        </section>
    );
}

function Metric({ label, value, detail, tone = "" }) {
    return (
        <div className={`report-focus-metric ${tone}`}>
            <span>{label}</span>
            <strong>{value}</strong>
            {detail && <small>{detail}</small>}
        </div>
    );
}

export default function ReportFocusSections({
    operations = {},
    analytics = {},
    deliveryTypes = [],
    customerMetrics = {},
    customerGrowthRate,
    previousRegistrations,
    containerAccountability = {},
}) {
    const topCustomers = analytics.customers?.top || [];
    const drivers = operations.drivers || [];
    const deliveryTotal = deliveryTypes.reduce(
        (total, item) => total + (Number(item.count) || 0),
        0
    );
    const registrationDataAvailable = customerMetrics.registrationDataAvailable;
    const registrationCount = customerMetrics.newRegistrations;
    const growthLabel = !registrationDataAvailable
        ? "Unavailable"
        : customerGrowthRate === null || customerGrowthRate === undefined
            ? Number(registrationCount) > 0
                ? "New"
                : "0%"
            : `${customerGrowthRate > 0 ? "+" : ""}${Number(customerGrowthRate).toFixed(1)}%`;
    const gcashPendingCount = Number(analytics.payments?.gcash?.pending) || 0;

    return (
        <>
            <section className="report-focus-section">
                <SectionHeading
                    number="02"
                    title="Station Volume & Capacity"
                    description="Completed sales volume and order mix for the selected period."
                />

                <div className="report-focus-grid report-focus-grid-two">
                    <FocusCard title="Water Volume" description="Delivered volume on completed orders.">
                        <div className="report-focus-metrics">
                            <Metric label="Total gallons sold" value={formatNumber(operations.gallonsSold)} />
                            <Metric
                                label="Average gallons per order"
                                value={`${formatNumber(analytics.averageGallonsPerOrder)} gal`}
                                detail="Completed orders only"
                            />
                        </div>
                    </FocusCard>

                    <FocusCard title="Sales by Delivery Type" description="Completed orders grouped by recorded delivery type.">
                        {deliveryTypes.length ? (
                            <div className="report-focus-list">
                                {deliveryTypes.map((item) => {
                                    const count = Number(item.count) || 0;
                                    const share = deliveryTotal > 0
                                        ? (count / deliveryTotal) * 100
                                        : 0;

                                    return (
                                        <div className="report-focus-list-item" key={item.type}>
                                            <div>
                                                <strong>{formatDeliveryType(item.type)}</strong>
                                                <span>{share.toFixed(1)}% of completed orders</span>
                                            </div>
                                            <strong>{formatNumber(count)}</strong>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="report-focus-empty">No completed orders in this period.</div>
                        )}
                    </FocusCard>
                </div>
            </section>

            <section className="report-focus-section">
                <SectionHeading
                    number="03"
                    title="Customer Growth & Retention"
                    description="Profile registrations and customer activity over a rolling 30-day window."
                />

                <div className="report-focus-grid report-focus-grid-two">
                    <FocusCard title="Growth & Retention" description="Active means an order in the last 30 days; churned means no order in that window.">
                        <div className="report-focus-metrics report-focus-metrics-three">
                            <Metric
                                label="Customer growth"
                                value={growthLabel}
                                detail={registrationDataAvailable
                                    ? `${formatNumber(registrationCount)} new profiles · ${formatNumber(previousRegistrations)} prior period`
                                    : "Profile creation dates unavailable"}
                                tone="growth"
                            />
                            <Metric
                                label="Active customers"
                                value={formatNumber(customerMetrics.activeLast30Days)}
                                detail="Ordered in last 30 days"
                                tone="positive"
                            />
                            <Metric
                                label="Churned customers"
                                value={formatNumber(customerMetrics.churnedLast30Days)}
                                detail="No order in over 30 days"
                                tone="attention"
                            />
                        </div>
                    </FocusCard>

                    <FocusCard title="Top 5 Valued Customers" description="Ranked by completed sales in the selected period.">
                        {topCustomers.length ? (
                            <div className="report-focus-list">
                                {topCustomers.slice(0, 5).map((customer, index) => (
                                    <div className="report-focus-list-item" key={customer.id}>
                                        <div className="report-focus-ranked-customer">
                                            <span>{index + 1}</span>
                                            <div>
                                                <strong>{customer.name}</strong>
                                                <span>{formatNumber(customer.orders)} orders · {formatNumber(customer.gallons)} gallons</span>
                                            </div>
                                        </div>
                                        <strong>{formatCurrency(customer.spent)}</strong>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="report-focus-empty">No completed customer sales in this period.</div>
                        )}
                    </FocusCard>
                </div>
            </section>

            <section className="report-focus-section">
                <SectionHeading
                    number="04"
                    title="Operational Assets & Control"
                    description="Container exposure, completed driver work, and payment approvals requiring attention."
                />

                <div className="report-focus-grid report-focus-grid-three">
                    <FocusCard title="Container Accountability" description="Lifetime totals from recorded borrowing activity.">
                        <div className="report-focus-list">
                            <div className="report-focus-list-item">
                                <span>Total borrowed</span>
                                <strong>{formatNumber(containerAccountability.borrowed)}</strong>
                            </div>
                            <div className="report-focus-list-item">
                                <span>Total returned</span>
                                <strong>{formatNumber(containerAccountability.returned)}</strong>
                            </div>
                            <div className="report-focus-list-item highlight">
                                <span>Outstanding with customers</span>
                                <strong>{formatNumber(containerAccountability.outstanding)}</strong>
                            </div>
                            <div className="report-focus-list-item compact">
                                <span>Damaged / missing</span>
                                <strong>{formatNumber(Number(containerAccountability.damaged) + Number(containerAccountability.missing))}</strong>
                            </div>
                        </div>
                    </FocusCard>

                    <FocusCard title="Completed Deliveries by Driver" description="Completed deliveries and gallons for each registered driver.">
                        {drivers.length ? (
                            <div className="report-focus-list">
                                {drivers.map((driver) => (
                                    <div className="report-focus-list-item" key={driver.driverId}>
                                        <div>
                                            <strong>{driver.driverName}</strong>
                                            <span>{formatNumber(driver.gallons)} gallons delivered</span>
                                        </div>
                                        <strong>{formatNumber(driver.deliveries)} completed</strong>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="report-focus-empty">No drivers are registered.</div>
                        )}
                    </FocusCard>

                    <FocusCard title="Payment Reconciliation Backlog" description="GCash orders awaiting admin verification.">
                        <div className="report-payment-backlog">
                            <span>Unverified payment value</span>
                            <strong>{formatCurrency(analytics.payments?.gcash?.unverified)}</strong>
                            <small>{formatNumber(gcashPendingCount)} payment{gcashPendingCount === 1 ? "" : "s"} awaiting approval</small>
                        </div>
                    </FocusCard>
                </div>
            </section>
        </>
    );
}
