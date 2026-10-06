import React, { useMemo, useState } from "react";

function CustomerContainerTracking({ customers = [] }) {
    const [search, setSearch] = useState("");
    const rows = useMemo(() => (Array.isArray(customers) ? customers : []).filter((item) => {
        const name = String(item?.customer_name || item?.customer_id || "");
        return name.toLowerCase().includes(search.toLowerCase());
    }), [customers, search]);
    function formatDate(value) {
        const date = new Date(value || 0);
        return !value || Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    }
    return <div className="inventory-table-card">
        <div className="inventory-section-heading">
            <div><h5>Customer Container Tracking</h5><p>Track containers sold to customers.</p></div>
            <div className="inventory-search"><i className="bi bi-search" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customer..." /></div>
        </div>
        <div className="table-responsive"><table className="table align-middle">
            <thead><tr><th>Customer</th><th>Container Size</th><th>Quantity</th><th>Last Transaction</th><th>Status</th></tr></thead>
            <tbody>{rows.length === 0 ? <tr><td colSpan="5" className="text-center py-5 text-muted">No customer container records found.</td></tr> : rows.map((customer) => <tr key={`${customer.customer_id}-${customer.capacity}`}>
                <td><strong>{customer.customer_name || customer.customer_id || "Unknown Customer"}</strong></td>
                <td>{customer.capacity || "—"}</td>
                <td><span className="inventory-count-badge">{Number(customer.quantity) || 0}</span></td>
                <td>{formatDate(customer.last_transaction)}</td>
                <td><span className="inventory-status active">{String(customer.status || "WITH CUSTOMER").toLowerCase() === "with customer" ? "Sold to Customers" : customer.status}</span></td>
            </tr>)}</tbody>
        </table></div>
    </div>;
}

export default CustomerContainerTracking;
