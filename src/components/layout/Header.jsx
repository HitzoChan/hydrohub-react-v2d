import { useState } from "react";

function Header() {

  const [search, setSearch] = useState("");

  // Temporary function
  const toggleSidebar = () => {
    console.log("Sidebar toggle clicked");
  };

  return (
    <div className="topbar d-flex justify-content-between align-items-center mb-4">

      {/* LEFT: SEARCH + MENU */}
      <div className="d-flex align-items-center gap-3 w-100">

        {/* MOBILE MENU BUTTON */}
        <button
          className="btn btn-light d-md-none"
          onClick={toggleSidebar}
        >
          <i className="bi bi-list"></i>
        </button>

        {/* SEARCH */}
        <input
          className="form-control w-50"
          type="text"
          placeholder="Search customers, orders, drivers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

      </div>

      {/* RIGHT: ACTIONS */}
      <div className="d-flex align-items-center gap-4">

        {/* Notification */}
        <div className="position-relative">
          <i className="bi bi-bell fs-5"></i>
          <span className="notification-dot"></span>
        </div>

        {/* User */}
        <div className="d-flex align-items-center gap-2">

          <div className="user-avatar">
            A
          </div>

          <span className="fw-semibold">
            Admin
          </span>

        </div>

      </div>

    </div>
  );
}

export default Header;