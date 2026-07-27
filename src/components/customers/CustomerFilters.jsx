function CustomerFilters({
  search,
  setSearch,
  status,
  setStatus,
}) {
  return (
    <div className="card shadow-sm border-0 mb-4">

      <div className="card-body">

        <div className="row g-3 align-items-center">

          {/* Search */}

          <div className="col-lg-8">

            <div className="input-group">

              <span className="input-group-text bg-white">

                <i className="bi bi-search"></i>

              </span>

              <input
                type="text"
                className="form-control"
                placeholder="Search customer by name, phone, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

            </div>

          </div>

          {/* Status */}

          <div className="col-lg-3">

            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >

              <option value="all">
                All Customers
              </option>

              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>

            </select>

          </div>

          {/* Reset */}

          <div className="col-lg-1">

            <button
              type="button"
              className="btn btn-outline-secondary w-100"
              onClick={() => {
                setSearch("");
                setStatus("all");
              }}
            >

              <i className="bi bi-arrow-clockwise"></i>

            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default CustomerFilters;