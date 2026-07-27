function DeliveryStats({ stats }) {

  const cards = [

    {
      title: "Total Deliveries",
      value: stats.total,
      description:"All Records",
      icon: "bi-truck",
      color: "blue",
    },

    {
      title: "Pending",
      value: stats.pending,
      description:"Awaiting Driver",
      icon: "bi-hourglass-split",
      color: "orange",
    },

    {
      title: "Assigned",
      value: stats.assigned,
      description:"Driver Assigned",
      icon: "bi-person-check",
      color: "green",
    },

    {
      title: "In Transit",
      value: stats.inTransit,
      description:"On The Road",
      icon: "bi-truck-flatbed",
      color: "blue",
    },

    {
      title: "Active Drivers",
      value: stats.activeDrivers,
      description:"Active Now",
      icon: "bi-person-badge",
      color: "green",
    },

    {
      title: "Delivered",
      value: stats.delivered,
      description:"Completed",
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

          <div className={`stat-box ${card.color}`}>

            <div className="stat-info">

              <h6 className="stat-title">

                {card.title}

              </h6>

              <h2 className="stat-value">

                {card.value}

              </h2>

            <p className="stat-description">

                {card.description.length > 18
                    ? card.description.substring(0,18) + "..."
                    : card.description}

            </p>

            </div>

            <div className="delivery-stat-icon">

              <i className={`bi ${card.icon}`}></i>

            </div>

          </div>

        </div>

      ))}

    </div>

  );

}

export default DeliveryStats;