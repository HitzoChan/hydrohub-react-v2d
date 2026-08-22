function DeliveryStats({ stats }) {
  const cards = [
    {
      title: "Total Deliveries",
      value: stats.total ?? 0,
      description: "All Records",
      icon: "bi-truck",
      color: "blue",
    },

    {
      title: "Pending",
      value: stats.pending ?? 0,
      description: "Awaiting Driver",
      icon: "bi-hourglass-split",
      color: "orange",
    },

    {
      title: "Assigned",
      value: stats.assigned ?? 0,
      description: "Driver Assigned",
      icon: "bi-person-check",
      color: "green",
    },

    {
      title: "In Transit",
      value: stats.inTransit ?? 0,
      description: "On The Road",
      icon: "bi-truck-flatbed",
      color: "blue",
    },

    {
      title: "Active Drivers",
      value: stats.activeDrivers ?? 0,
      description: "Active Now",
      icon: "bi-person-badge",
      color: "green",
    },

    {
      title: "Delivered",
      value: stats.delivered ?? 0,
      description: "Completed",
      icon: "bi-check-circle",
      color: "purple",
    },
  ];

  return (
    <div className="row g-4 mb-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="col-xxl-2 col-xl-4 col-lg-4 col-md-6"
        >
          <div
            className={`stat-box ${card.color}`}
            style={{
              height: "150px",
              position: "relative",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "22px",
            }}
          >
            {/* LEFT CONTENT */}
            <div
              className="stat-info"
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                paddingRight: "10px",
              }}
            >
              {/* TITLE */}
              <h6
                className="stat-title"
                style={{
                  margin: 0,
                  height: "22px",
                  display: "flex",
                  alignItems: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {card.title}
              </h6>

              {/* NUMBER */}
              <h2
                className="stat-value"
                style={{
                  margin: 0,
                  height: "45px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {card.value}
              </h2>

              {/* DESCRIPTION */}
              <p
                className="stat-description"
                style={{
                  margin: 0,
                  height: "22px",
                  display: "flex",
                  alignItems: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {card.description}
              </p>
            </div>

            {/* ICON */}
            <div
              className="delivery-stat-icon"
              style={{
                flexShrink: 0,
              }}
            >
              <i className={`bi ${card.icon}`}></i>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default DeliveryStats;