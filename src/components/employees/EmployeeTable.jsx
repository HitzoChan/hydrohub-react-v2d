export default function EmployeeTable({
  loading,
  employees,
  onView,
}) {
  if (loading) {
    return (
      <div className="py-5 text-center">

        <div
          className="spinner-border text-primary mb-3"
          role="status"
        />

        <h5 className="mb-1">
          Loading Employees...
        </h5>

        <p className="text-muted mb-0">
          Please wait while HydroHub retrieves employee records.
        </p>

      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="text-center py-5">

        <i
          className="bi bi-people"
          style={{
            fontSize: "70px",
            color: "#cbd5e1",
          }}
        />

        <h4 className="mt-3">
          No Employees Found
        </h4>

        <p className="text-muted">
          There are currently no registered employees.
        </p>

      </div>
    );
  }

  return (

    <div className="table-responsive">

      <table className="table employee-table align-middle mb-0">

        <thead>

          <tr>

            <th>Employee</th>

            <th>Email</th>

            <th>Role</th>

            <th>Phone</th>

            <th>Status</th>

            <th>Access Code</th>

            <th className="text-center">
              Actions
            </th>

          </tr>

        </thead>

        <tbody>

          {employees.map((employee) => {

            const initials =
              employee.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase() || "?";

            return (

              <tr key={employee.id}>

                              {/* ============================
                  Employee
              ============================ */}

              <td>

                <div className="employee-info">

                  {/* Avatar */}

                  <div className="employee-avatar">
                    {initials}
                  </div>

                  {/* Details */}

                  <div className="employee-details">

                    <div
                      className="employee-name"
                      title={employee.name}
                    >
                      {employee.name}
                    </div>

                    <div className="employee-id">
                      {employee.employee_id}
                    </div>

                  </div>

                </div>

              </td>

              <td>
                <div
                  className="employee-email"
                  title={employee.email}
                >
                  {employee.email || "No email address"}
                </div>
              </td>

              {/* ============================
                  Role
              ============================ */}

              <td>

                <span className="badge bg-primary-subtle text-primary">

                  {employee.role || "N/A"}

                </span>

              </td>

              {/* ============================
                  Phone
              ============================ */}

              <td>

                {employee.phone || "-"}

              </td>

              {/* ============================
                  Status
              ============================ */}

              <td>

                <span
                  className={
                    employee.status?.toLowerCase() === "active"
                      ? "badge-active"
                      : "badge-inactive"
                  }
                >

                  {employee.status || "Inactive"}

                </span>

              </td>

                            {/* ============================
                  Access Code
              ============================ */}

              <td>

                <span className="code">
                  {employee.access_code || "-"}
                </span>

              </td>

              {/* ============================
                  Actions
              ============================ */}

              <td className="text-center">

                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onView(employee)}
                >
                  <i className="bi bi-person-gear me-1"></i>
                  Manage
                </button>

              </td>

            </tr>

            );

          })}

        </tbody>

      </table>

    </div>

  );

}

              