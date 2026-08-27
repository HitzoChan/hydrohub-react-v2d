function Header() {
  const toggleSidebar = () => {
    document.dispatchEvent(
      new CustomEvent("hydrohub:toggle-sidebar")
    );
  };

  return (
    <div className="topbar d-flex justify-content-between align-items-center mb-4">

      {/* LEFT: MENU */}
      <div className="topbar-left d-flex align-items-center gap-3">

        {/* MOBILE MENU BUTTON */}
        <button
          className="btn btn-light mobile-menu-button"
          type="button"
          aria-label="Open navigation menu"
          onClick={toggleSidebar}
        >
          <i className="bi bi-list"></i>
        </button>

      </div>

      {/* RIGHT: ACTIONS */}
      <div className="d-flex align-items-center gap-4">

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