function DeliveryFilters({
  search,
  status,
  onSearch,
  onStatusChange,
  onReset,
}) {
  return (
    <div className="card shadow-sm border-0 mb-4">

      <div className="card-body">

        <div className="row g-3 align-items-center">

          {/* Search */}

          <div className="col-lg">

            <div className="input-group">

              <span className="input-group-text bg-white border-end-0">

                <i className="bi bi-search"></i>

              </span>

              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search Customer or Order ID..."
                value={search}
                onChange={(e) =>
                  onSearch(e.target.value)
                }
              />

            </div>

          </div>


          {/* Status Filter */}

          <div className="col-lg-3">

            <select
              className="form-select"
              value={status}
              onChange={(e) =>
                onStatusChange(e.target.value)
              }
            >

              <option value="all">
                All Status
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="assigned">
                Assigned
              </option>

              <option value="in_transit">
                In Transit
              </option>

              <option value="delivered">
                Delivered
              </option>

              <option value="cancelled">
                Cancelled
              </option>

              <option value="rejected">
                Rejected
              </option>

            </select>

          </div>


          {/* Reset */}

          <div className="col-lg-auto">

            <button
              type="button"
              className="btn btn-outline-secondary w-100"
              onClick={onReset}
            >

              <i className="bi bi-arrow-clockwise me-2"></i>

              Reset

            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default DeliveryFilters;