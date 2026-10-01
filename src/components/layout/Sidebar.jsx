import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getConversations } from "../../services/messaging.service";
import useAuth from "../../hooks/useAuth";
import logo from "../../assets/images/logo.png";

function Sidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [conversationCount, setConversationCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState(() =>
    localStorage.getItem("hydrohub-theme") === "dark" ? "dark" : "light"
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.bsTheme = theme;
    localStorage.setItem("hydrohub-theme", theme);
    document.dispatchEvent(
      new CustomEvent("hydrohub:theme-change", { detail: { theme } })
    );
  }, [theme]);

  function handleLogout() {
    logout();
    setIsOpen(false);
    navigate("/login", { replace: true });
  }

  useEffect(() => {
    const toggleSidebar = () => {
      setIsOpen((open) => !open);
    };

    const closeSidebar = () => {
      setIsOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeSidebar();
      }
    };

    document.addEventListener(
      "hydrohub:toggle-sidebar",
      toggleSidebar
    );
    document.addEventListener(
      "hydrohub:close-sidebar",
      closeSidebar
    );
    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "hydrohub:toggle-sidebar",
        toggleSidebar
      );
      document.removeEventListener(
        "hydrohub:close-sidebar",
        closeSidebar
      );
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

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
    <>
      <div
        className={`sidebar-backdrop ${isOpen ? "visible" : ""}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <div className={`sidebar p-3 ${isOpen ? "active" : ""}`}>
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
          onClick={() => setIsOpen(false)}
        >
          <i className="bi bi-grid"></i>
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/orders"
          className="nav-link"
          onClick={() => setIsOpen(false)}
        >
          <i className="bi bi-cart"></i>
          <span>Orders</span>
        </NavLink>

        <NavLink
          to="/customers"
          className="nav-link"
          onClick={() => setIsOpen(false)}
        >
          <i className="bi bi-people"></i>
          <span>Customers</span>
        </NavLink>

        <NavLink
          to="/deliveries"
          className="nav-link"
          onClick={() => setIsOpen(false)}
        >
          <i className="bi bi-truck"></i>
          <span>Deliveries</span>
        </NavLink>

        <NavLink
          to="/map"
          className="nav-link"
          onClick={() => setIsOpen(false)}
        >
          <i className="bi bi-geo-alt"></i>
          <span>Map Monitoring</span>
        </NavLink>

        <NavLink
          to="/messaging"
          className="nav-link d-flex align-items-center"
          onClick={() => setIsOpen(false)}
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
          onClick={() => setIsOpen(false)}
        >
          <i className="bi bi-box"></i>
          <span>Inventory</span>
        </NavLink>

        <NavLink
          to="/expenses"
          className="nav-link"
          onClick={() => setIsOpen(false)}
        >
          <i className="bi bi-cash-stack"></i>
          <span>Expenses</span>
        </NavLink>

        <NavLink
          to="/reservations"
          className="nav-link"
          onClick={() => setIsOpen(false)}
        >
          <i className="bi bi-calendar-check"></i>
          <span>Reservations</span>
        </NavLink>

        <NavLink
          to="/reports"
          className="nav-link"
          onClick={() => setIsOpen(false)}
        >
          <i className="bi bi-bar-chart"></i>
          <span>Reports</span>
        </NavLink>

        <NavLink
          to="/feedback"
          className="nav-link"
          onClick={() => setIsOpen(false)}
        >
          <i className="bi bi-star"></i>
          <span>Feedback</span>
        </NavLink>

        <NavLink
          to="/employees"
          className="nav-link mt-3"
          onClick={() => setIsOpen(false)}
        >
          <i className="bi bi-person-badge"></i>
          <span>Employees</span>
        </NavLink>

        <NavLink
          to="/settings"
          className="nav-link"
          onClick={() => setIsOpen(false)}
        >
          <i className="bi bi-gear"></i>
          <span>Settings</span>
        </NavLink>
      </ul>

      <div className="sidebar-footer">
        <div className="sidebar-station-profile">
          <img src={logo} alt="" />
          <div className="sidebar-station-copy">
            <strong>Aqua en Lavada</strong>
            <small>Water Refilling Station</small>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-logout-button"
          onClick={handleLogout}
        >
          <i className="bi bi-box-arrow-right" aria-hidden="true" />
          <span>Log out</span>
        </button>

        <div className="sidebar-theme-control" role="group" aria-label="Website color theme">
          <button
            type="button"
            className={theme === "light" ? "active" : ""}
            aria-pressed={theme === "light"}
            onClick={() => setTheme("light")}
          >
            <i className="bi bi-sun" aria-hidden="true" />
            Light
          </button>
          <button
            type="button"
            className={theme === "dark" ? "active" : ""}
            aria-pressed={theme === "dark"}
            onClick={() => setTheme("dark")}
          >
            <i className="bi bi-moon-stars" aria-hidden="true" />
            Dark
          </button>
        </div>

      </div>
      </div>
    </>
  );
}

export default Sidebar;