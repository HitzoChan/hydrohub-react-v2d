import { supabase } from "../../lib/supabase";
import { deleteEmployee } from "../../services/employees.service";

export default function EmployeeDetailsDrawer({
  open,
  employee,
  onClose,
  onEdit,
  onRefresh,
}) {

function generateAccessCode(length = 8) {

    const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < length; i++) {

        code += chars.charAt(
            Math.floor(
                Math.random() * chars.length
            )
        );

    }

    return code;

}    

async function handleGenerateAccessCode() {

    if (!employee) return;

    const newCode = generateAccessCode();

    const { error } = await supabase
        .from("employees")
        .update({
            access_code: newCode,
            code_status: "activated"
        })
        .eq("id", employee.id);

    if (error) {
        alert("Unable to generate access code.");
        return;
    }

    await onRefresh?.();

    alert("New access code generated.");

}

async function handleDeactivateEmployee() {

    if (!employee) return;

    const isActive =
        employee.status?.toLowerCase() === "active";

    const newStatus =
        isActive ? "inactive" : "active";

    const action =
        isActive ? "Deactivate" : "Activate";

    const confirmed = window.confirm(
        `${action} ${employee.name}?`
    );

    if (!confirmed) return;

    const { error } = await supabase
        .from("employees")
        .update({
            status: newStatus
        })
        .eq("id", employee.id);

    if (error) {
        alert(`Unable to ${action.toLowerCase()} employee.`);
        return;
    }

    await onRefresh?.();

    alert(`Employee ${newStatus}.`);

    onClose();

}

async function handleDeleteEmployee() {

    if (!employee) return;

    const confirmed = window.confirm(
        `Delete ${employee.name}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
        await deleteEmployee(employee.id);
        await onRefresh?.();
        alert("Employee deleted successfully.");
        onClose();
    } catch (error) {
        console.error("Failed to delete employee:", error);
        alert("Unable to delete employee.");
    }

}

  if (!open || !employee) return null;

  const initials =
    employee.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "?";

  const fullAddress = [
    employee.street,
    employee.barangay,
    employee.city,
    employee.province,
  ]
    .filter(Boolean)
    .join(", ");

  return (

    <>

      {/* Backdrop */}

      <div
        className="position-fixed top-0 start-0 w-100 h-100"
        style={{
          background: "rgba(0,0,0,.35)",
          zIndex: 1054,
        }}
        onClick={onClose}
      />

      {/* Drawer */}

      <div
        className="employee-drawer position-fixed top-0 end-0 bg-white shadow-lg"
        style={{
          width: "470px",
          height: "100vh",
          zIndex: 1055,
          overflowY: "auto",
        }}
      >

        {/* ============================
            HEADER
        ============================ */}

        <div className="border-bottom p-4">

          <div className="d-flex justify-content-between align-items-start">

            <div>

              <small className="text-primary text-uppercase fw-semibold">

                HydroHub Employee

              </small>

              <h3 className="mb-1">

                Employee Profile

              </h3>

              <small className="text-muted">

                Employee Information & Management

              </small>

            </div>

            <button
              className="btn-close"
              onClick={onClose}
            />

          </div>

        </div>

        {/* ============================
            PROFILE
        ============================ */}

        <div className="p-4 border-bottom">

          <div className="text-center">

            <div
              className="rounded-circle bg-primary text-white fw-bold mx-auto d-flex align-items-center justify-content-center"
              style={{
                width: 90,
                height: 90,
                fontSize: 30,
              }}
            >

              {initials}

            </div>

            <h4 className="mt-3 mb-1">

              {employee.name}

            </h4>

            <div className="text-muted mb-3">

              {employee.role || "Employee"}

            </div>

            <div className="d-flex justify-content-center gap-2">

              <span
                className={`badge ${
                  employee.status?.toLowerCase() === "active"
                    ? "bg-success"
                    : "bg-secondary"
                }`}
              >

                {employee.status}

              </span>

              <span className="badge bg-primary">

                {employee.employee_id}

              </span>

            </div>

          </div>

        </div>

        <div className="p-4">

          {/* ============================
              PERSONAL INFORMATION
          ============================ */}

          <div className="card border-0 shadow-sm mb-4">

            <div className="card-header bg-white">

              <h6 className="mb-0">

                <i className="bi bi-person-fill me-2 text-primary"></i>

                Personal Information

              </h6>

            </div>

            <div className="card-body">

              <div className="mb-3">

                <small className="text-muted">

                  Email Address

                </small>

                <div className="fw-semibold">

                  {employee.email || "-"}

                </div>

              </div>

              <div className="mb-3">

                <small className="text-muted">

                  Phone Number

                </small>

                <div className="fw-semibold">

                  {employee.phone || "-"}

                </div>

              </div>

              <div className="row">

                <div className="col-6">

                  <small className="text-muted">

                    Birthdate

                  </small>

                  <div className="fw-semibold">

                    {employee.birthdate || "-"}

                  </div>

                </div>

                <div className="col-6">

                  <small className="text-muted">

                    Gender

                  </small>

                  <div className="fw-semibold">

                    {employee.gender || "-"}

                  </div>

                </div>

              </div>

              <hr />

              <small className="text-muted">

                Civil Status

              </small>

              <div className="fw-semibold">

                {employee.civil_status || "-"}

              </div>

            </div>

          </div>
                    {/* ============================
              EMPLOYMENT INFORMATION
          ============================ */}

          <div className="card border-0 shadow-sm mb-4">

            <div className="card-header bg-white">

              <h6 className="mb-0">
                <i className="bi bi-briefcase-fill me-2 text-primary"></i>
                Employment Information
              </h6>

            </div>

            <div className="card-body">

              <div className="row">

                <div className="col-6 mb-3">

                  <small className="text-muted">
                    Employee ID
                  </small>

                  <div className="fw-semibold">
                    {employee.employee_id || "-"}
                  </div>

                </div>

                <div className="col-6 mb-3">

                  <small className="text-muted">
                    Role
                  </small>

                  <div className="fw-semibold">
                    {employee.role || "-"}
                  </div>

                </div>

              </div>

              <div className="row">

                <div className="col-6">

                  <small className="text-muted">
                    Status
                  </small>

                  <div className="fw-semibold">

                    <span
                      className={`badge ${
                        employee.status?.toLowerCase() === "active"
                          ? "bg-success"
                          : "bg-secondary"
                      }`}
                    >
                      {employee.status || "-"}
                    </span>

                  </div>

                </div>

                <div className="col-6">

                  <small className="text-muted">
                    Date Hired
                  </small>

                  <div className="fw-semibold">
                    {employee.date_hired || "-"}
                  </div>

                </div>

              </div>

              <hr />

              <small className="text-muted">
                Driver's License Number
              </small>

              <div className="fw-semibold">
                {employee.license_number || "-"}
              </div>

            </div>

          </div>

          {/* ============================
              ADDRESS
          ============================ */}

          <div className="card border-0 shadow-sm mb-4">

            <div className="card-header bg-white">

              <h6 className="mb-0">
                <i className="bi bi-geo-alt-fill me-2 text-primary"></i>
                Address
              </h6>

            </div>

            <div className="card-body">

              <small className="text-muted">
                Complete Address
              </small>

              <div className="fw-semibold">

                {fullAddress || "-"}

              </div>

            </div>

          </div>

          {/* ============================
              EMERGENCY CONTACT
          ============================ */}

          <div className="card border-0 shadow-sm mb-4">

            <div className="card-header bg-white">

              <h6 className="mb-0">
                <i className="bi bi-telephone-fill me-2 text-primary"></i>
                Emergency Contact
              </h6>

            </div>

            <div className="card-body">

              <div className="mb-3">

                <small className="text-muted">
                  Contact Person
                </small>

                <div className="fw-semibold">
                  {employee.emergency_contact_name || "-"}
                </div>

              </div>

              <small className="text-muted">
                Contact Number
              </small>

              <div className="fw-semibold">
                {employee.emergency_contact_number || "-"}
              </div>

            </div>

          </div>

          {/* ============================
              ACCOUNT INFORMATION
          ============================ */}

          <div className="card border-0 shadow-sm mb-4">

            <div className="card-header bg-white">

              <h6 className="mb-0">
                <i className="bi bi-shield-lock-fill me-2 text-primary"></i>
                Account Information
              </h6>

            </div>

            <div className="card-body">

              <div className="mb-3">

                <small className="text-muted">
                  Access Code
                </small>

                <div
                  className="fw-bold text-primary"
                  style={{
                    letterSpacing: "2px",
                    fontSize: "1rem",
                  }}
                >
                  {employee.access_code || "-"}
                </div>

              </div>

              <small className="text-muted">
                Code Status
              </small>

              <div>

                <span
                  className={`badge ${
                    employee.code_status?.toLowerCase() === "active"
                      ? "bg-success"
                      : "bg-warning text-dark"
                  }`}
                >
                  {employee.code_status || "-"}
                </span>

              </div>

            </div>

          </div>
                    {/* ============================
              MANAGEMENT ACTIONS
          ============================ */}

          <div className="card border-0 shadow-sm mb-4">

            <div className="card-header bg-white">

              <h6 className="mb-0">
                <i className="bi bi-gear-fill me-2 text-primary"></i>
                Management Actions
              </h6>

            </div>

            <div className="card-body">

              <div className="d-grid gap-2">

                <button
                  className="btn btn-primary"
                  onClick={() => {
                    onClose();
                    onEdit(employee);
                  }}
                >
                  <i className="bi bi-pencil-square me-2"></i>
                  Edit Employee
                </button>

                <button
                    className="btn btn-outline-primary"
                    onClick={handleGenerateAccessCode}
                >                
                  <i className="bi bi-key-fill me-2"></i>
                  Generate New Access Code
                </button>

                <button
                    className="btn btn-outline-warning"
                    onClick={handleDeactivateEmployee}
                >
                  <i
                    className={`bi ${
                      employee.status?.toLowerCase() === "active"
                        ? "bi-person-x-fill"
                        : "bi-person-check-fill"
                    } me-2`}
                  ></i>

                  {employee.status?.toLowerCase() === "active"
                    ? "Deactivate Employee"
                    : "Activate Employee"}
                </button>

                <button
                  className="btn btn-outline-danger"
                  onClick={handleDeleteEmployee}
                >
                  <i className="bi bi-trash-fill me-2"></i>
                  Delete Employee
                </button>

              </div>

            </div>

          </div>

        </div>

        {/* Footer */}

        <div
          className="border-top bg-white p-3 position-sticky bottom-0"
          style={{ zIndex: 10 }}
        >

          <div className="d-grid">

            <button
              className="btn btn-secondary"
              onClick={onClose}
            >
              <i className="bi bi-x-circle me-2"></i>
              Close
            </button>

          </div>

        </div>

      </div>

    </>

  );

}