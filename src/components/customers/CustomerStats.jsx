import { useEffect, useState } from "react";
import { getCustomers } from "../../services/customers.service";

function CustomerStats() {

  const [stats, setStats] = useState({

    total: 0,

    active: 0,

    inactive: 0,

    totalOrders: 0,

  });

  useEffect(() => {

    async function loadStats() {

      const customers = await getCustomers();

      const total = customers.length;

      const active = customers.filter(
        (c) => c.status === "Active"
      ).length;

      const inactive = customers.filter(
        (c) => c.status === "Inactive"
      ).length;

      const totalOrders = customers.reduce(
        (sum, customer) => sum + (customer.orders || 0),
        0
      );

      setStats({

        total,

        active,

        inactive,

        totalOrders,

      });

    }

    loadStats();

  }, []);

  const cards = [

    {
      title: "Total Customers",
      value: stats.total,
      icon: "bi-people-fill",
      color: "primary",
    },

    {
      title: "Active Customers",
      value: stats.active,
      icon: "bi-person-check-fill",
      color: "success",
    },

    {
      title: "Inactive Customers",
      value: stats.inactive,
      icon: "bi-person-x-fill",
      color: "secondary",
    },

    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: "bi-box-seam",
      color: "warning",
    },

  ];

  return (

    <div className="row g-4 mb-4">

      {cards.map((card) => (

        <div
          className="col-xl-3 col-md-6"
          key={card.title}
        >

          <div className="card border-0 shadow-sm h-100">

            <div className="card-body d-flex justify-content-between align-items-center">

              <div>

                <p className="text-muted mb-1">

                  {card.title}

                </p>

                <h3 className="fw-bold mb-0">

                  {card.value}

                </h3>

              </div>

              <div
                className={`bg-${card.color} bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center`}
                style={{
                  width: "60px",
                  height: "60px",
                }}
              >

                <i
                  className={`bi ${card.icon} fs-3 text-${card.color}`}
                ></i>

              </div>

            </div>

          </div>

        </div>

      ))}

    </div>

  );

}

export default CustomerStats;