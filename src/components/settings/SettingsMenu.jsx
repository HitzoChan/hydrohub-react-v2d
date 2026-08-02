import {
    House,
    Droplet,
    Truck,
    CreditCard,
    People,
    PersonCircle
} from "react-bootstrap-icons";

export default function SettingsMenu({
    activeTab,
    setActiveTab
}) {

    const menus = [

        {
            id: "overview",
            label: "Overview",
            icon: <House size={18} />
        },

        {
            id: "products",
            label: "Products",
            icon: <Droplet size={18} />
        },

        {
            id: "delivery",
            label: "Delivery",
            icon: <Truck size={18} />
        },

        {
            id: "payment",
            label: "Payment",
            icon: <CreditCard size={18} />
        },

        {
            id: "employee",
            label: "Employee",
            icon: <People size={18} />
        },

        {
            id: "account",
            label: "Account",
            icon: <PersonCircle size={18} />
        }

    ];

    return (

        <div className="card shadow-sm">

            <div className="list-group list-group-flush">

                {menus.map(menu => (

                    <button
                        key={menu.id}
                        type="button"
                        onClick={() => setActiveTab(menu.id)}
                        className={`list-group-item list-group-item-action d-flex align-items-center gap-2 ${
                            activeTab === menu.id ? "active" : ""
                        }`}
                    >

                        {menu.icon}

                        <span>

                            {menu.label}

                        </span>

                    </button>

                ))}

            </div>

        </div>

    );

}