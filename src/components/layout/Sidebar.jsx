import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { getConversations } from "../../services/messaging.service";
import logo from "../../assets/images/logo.png";

function Sidebar() {
  const [conversationCount, setConversationCount] = useState(0);

  useEffect(() => {
    async function loadConversationCount() {
      try {
        const conversations = await getConversations();
        setConversationCount(conversations.length);
      } catch (error) {
        console.error("Failed to load conversation count:", error);
      }
    }

    // Initial load
    loadConversationCount();

    // Refresh every 5 seconds
    const interval = setInterval(loadConversationCount, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="sidebar p-3">
      <img
        src={logo}
        alt="HydroHub Logo"
        className="sidebar-logo"
        id="sidebarLogo"
      />

      <ul className="nav flex-column">
        <NavLink
          to="/dashboard"
          className="nav-link"
        >
          <i className="bi bi-grid"></i>
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/orders"
          className="nav-link"
        >
          <i className="bi bi-cart"></i>
          <span>Orders</span>
        </NavLink>

        <NavLink
          to="/customers"
          className="nav-link"
        >
          <i className="bi bi-people"></i>
          <span>Customers</span>
        </NavLink>

        <NavLink
          to="/deliveries"
          className="nav-link"
        >
          <i className="bi bi-truck"></i>
          <span>Deliveries</span>
        </NavLink>

        <NavLink
          to="/map"
          className="nav-link"
        >
          <i className="bi bi-geo-alt"></i>
          <span>Map Monitoring</span>
        </NavLink>

        <NavLink
          to="/messaging"
          className="nav-link d-flex align-items-center"
        >
          <i className="bi bi-chat-dots"></i>

          <span className="ms-2">Messaging</span>

          {conversationCount > 0 && (
            <span
              className="badge bg-danger ms-auto"
              style={{
                minWidth: "22px",
                height: "22px",
                padding: "0 7px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "999px",
                fontSize: "11px",
                fontWeight: "700",
                lineHeight: "1",
              }}
            >
              {conversationCount}
            </span>
          )}
        </NavLink>

        <NavLink
          to="/inventory"
          className="nav-link"
        >
          <i className="bi bi-box"></i>
          <span>Inventory</span>
        </NavLink>

        <NavLink
          to="/expenses"
          className="nav-link"
        >
          <i className="bi bi-cash-stack"></i>
          <span>Expenses</span>
        </NavLink>

        <NavLink
          to="/reservations"
          className="nav-link"
        >
          <i className="bi bi-calendar-check"></i>
          <span>Reservations</span>
        </NavLink>

        <NavLink
          to="/reports"
          className="nav-link"
        >
          <i className="bi bi-bar-chart"></i>
          <span>Reports</span>
        </NavLink>

        <NavLink
          to="/feedback"
          className="nav-link"
        >
          <i className="bi bi-star"></i>
          <span>Feedback</span>
        </NavLink>

        <NavLink
          to="/employees"
          className="nav-link mt-3"
        >
          <i className="bi bi-person-badge"></i>
          <span>Employees</span>
        </NavLink>

        <NavLink
          to="/settings"
          className="nav-link"
        >
          <i className="bi bi-gear"></i>
          <span>Settings</span>
        </NavLink>
      </ul>
    </div>
  );
}

export default Sidebar;