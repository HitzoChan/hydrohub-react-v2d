import React from "react";

function InventoryStats({
    inventory = [],
}) {

    const totals = inventory.reduce(
        (result, item) => {

            result.total +=
                Number(
                    item?.total ?? 0
                );

            result.full +=
                Number(
                    item?.full ?? 0
                );

            result.empty +=
                Number(
                    item?.empty ?? 0
                );

            result.customers +=
                Number(
                    item?.with_customers ?? 0
                );

            result.drivers +=
                Number(
                    item?.with_drivers ?? 0
                );

            result.damaged +=
                Number(
                    item?.damaged ?? 0
                );

            result.missing +=
                Number(
                    item?.missing ?? 0
                );

            return result;

        },
        {
            total: 0,
            full: 0,
            empty: 0,
            customers: 0,
            drivers: 0,
            damaged: 0,
            missing: 0,
        }
    );


    /*
    |--------------------------------------------------------------------------
    | CIRCULATION RATE
    |--------------------------------------------------------------------------
    */

    const accounted =
        totals.full +
        totals.empty +
        totals.customers +
        totals.drivers +
        totals.damaged +
        totals.missing;

    const circulation =
        totals.total > 0
            ? Math.round(
                (
                    accounted /
                    totals.total
                ) * 100
            )
            : 0;


    const cards = [

        {
            title: "Total Containers",
            value: totals.total,
            icon: "bi-box-seam",
            className: "",
        },

        {
            title: "Full / Available",
            value: totals.full,
            icon: "bi-droplet-fill",
            className: "success",
        },

        {
            title: "Empty Recovered",
            value: totals.empty,
            icon: "bi-box",
            className: "",
        },

        {
            title: "Sold to Customers",
            value: totals.customers,
            icon: "bi-person",
            className: "purple",
        },

        {
            title: "With Drivers",
            value: totals.drivers,
            icon: "bi-truck",
            className: "warning",
        },

        {
            title: "Damaged",
            value: totals.damaged,
            icon: "bi-exclamation-triangle",
            className: "danger",
        },

        {
            title: "Missing",
            value: totals.missing,
            icon: "bi-question-circle",
            className: "danger",
        },

        {
            title: "Circulation Rate",
            value: `${circulation}%`,
            icon: "bi-arrow-repeat",
            className: "success",
        },

    ];


    return (

        <div className="inventory-stats">

            {cards.map((card) => (

                <div
                    className={`inventory-stat-card ${card.className}`}
                    key={card.title}
                >

                    <div className="inventory-stat-top">

                        <span>
                            {card.title}
                        </span>

                        <i
                            className={`bi ${card.icon}`}
                        />

                    </div>

                    <h3>
                        {card.value}
                    </h3>

                </div>

            ))}

        </div>

    );
}

export default InventoryStats;