import { useState } from "react";

import {
  createEmployee,
  updateEmployee,
  generateAccessCode,
} from "../../services/employees.service";

const defaultForm = {
  name: "",
  birthdate: "",
  gender: "",
  civil_status: "",
  phone: "",
  email: "",

  emergency_contact_name: "",
  emergency_contact_number: "",

  street: "",
  barangay: "",
  city: "",
  province: "",

  role: "",
  status: "Active",
  date_hired: "",
  license_number: "",

  access_code: "",
  code_status: "Activated",
};

export default function EmployeeModal({
  open,
  employee,
  onClose,
  onSaved,
}) {

  function createFormData(employeeData) {

    if (employeeData) {
      return {
        ...defaultForm,
        ...employeeData,
      };
    }

    return {
      ...defaultForm,
      access_code: generateAccessCode(),
    };

  }

  const [form, setForm] = useState(() =>
    createFormData(employee)
  );

  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {

    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

  };

  const handleClose = () => {

    setForm(createFormData(null));

    onClose();

  };

  async function handleSubmit(e) {

    e.preventDefault();

    try {

      setSaving(true);

      if (employee) {
        await updateEmployee(employee.id, form);
      } else {
        await createEmployee(form);
      }

      await onSaved();

      setForm(createFormData(null));

      handleClose();

    } catch (err) {

      console.error(err);

      alert("Unable to save employee.");

    } finally {

      setSaving(false);

    }

  }

  if (!open) return null;

  return (

    <div className="modal-backdrop-custom">

      <div
        className="employee-modal shadow-lg"
      >

        {/* =============================
            HEADER
        ============================= */}

        <div className="employee-modal-header">

          <div>

            <small className="text-primary fw-semibold text-uppercase">

              HydroHub Employee Management

            </small>

            <h3 className="mb-1">

              {employee
                ? "Edit Employee"
                : "Add New Employee"}

            </h3>

            <p className="text-muted mb-0">

              Complete the employee information below.

            </p>

          </div>

          <button
            type="button"
            className="btn-close"
            onClick={handleClose}
          />

        </div>

        <form
          onSubmit={handleSubmit}
          className="employee-modal-form"
        >

          <div className="employee-modal-body">

            {/* =============================
                PERSONAL INFORMATION
            ============================= */}

            <div className="form-section">

              <h5 className="section-title">

                <i className="bi bi-person-circle me-2"></i>

                Personal Information

              </h5>

              <div className="row g-4">

                <div className="col-lg-6">

                  <label className="form-label">

                    Full Name
                    <span className="text-danger"> *</span>

                  </label>

                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Juan Dela Cruz"
                    required
                  />

                </div>

                <div className="col-lg-6">

                  <label className="form-label">

                    Birthdate

                  </label>

                  <input
                    type="date"
                    className="form-control"
                    name="birthdate"
                    value={form.birthdate}
                    onChange={handleChange}
                  />

                </div>

                <div className="col-md-4">

                  <label className="form-label">

                    Gender

                  </label>

                  <select
                    className="form-select"
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                  >

                    <option value="">
                      Select Gender
                    </option>

                    <option value="Male">
                      Male
                    </option>

                    <option value="Female">
                      Female
                    </option>

                  </select>

                </div>

                <div className="col-md-4">

                  <label className="form-label">

                    Civil Status

                  </label>

                  <select
                    className="form-select"
                    name="civil_status"
                    value={form.civil_status}
                    onChange={handleChange}
                  >

                    <option value="">
                      Select Status
                    </option>

                    <option value="Single">
                      Single
                    </option>

                    <option value="Married">
                      Married
                    </option>

                    <option value="Widowed">
                      Widowed
                    </option>

                    <option value="Separated">
                      Separated
                    </option>

                  </select>

                </div>

                <div className="col-md-4">

                  <label className="form-label">

                    Phone Number

                  </label>

                  <input
                    type="text"
                    className="form-control"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="09XXXXXXXXX"
                  />

                </div>

                <div className="col-12">

                  <label className="form-label">

                    Email Address

                  </label>

                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="employee@hydrohub.com"
                  />

                </div>

              </div>

            </div>

            {/* =============================
                EMPLOYMENT INFORMATION
            ============================= */}

            <div className="form-section mt-5">

              <h5 className="section-title">

                <i className="bi bi-briefcase-fill me-2"></i>

                Employment Information

              </h5>

              <div className="row g-4">
               
                               <div className="col-lg-6">

                  <label className="form-label">

                    Employee Role
                    <span className="text-danger"> *</span>

                  </label>

                  <select
                    className="form-select"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    required
                  >

                    <option value="">
                      Select Employee Role
                    </option>

                    <option value="admin">
                      Administrator
                    </option>

                    <option value="staff">
                      Office Staff
                    </option>

                    <option value="driver">
                      Delivery Driver
                    </option>

                  </select>

                </div>

                <div className="col-lg-6">

                  <label className="form-label">

                    Employment Status

                  </label>

                  <select
                    className="form-select"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >

                    <option value="Active">
                      Active
                    </option>

                    <option value="Inactive">
                      Inactive
                    </option>

                    <option value="On Leave">
                      On Leave
                    </option>

                  </select>

                </div>

                <div className="col-lg-6">

                  <label className="form-label">

                    Date Hired

                  </label>

                  <input
                    type="date"
                    className="form-control"
                    name="date_hired"
                    value={form.date_hired}
                    onChange={handleChange}
                  />

                </div>

                <div className="col-lg-6">

                  <label className="form-label">

                    Driver's License Number

                  </label>

                  <input
                    type="text"
                    className="form-control"
                    name="license_number"
                    value={form.license_number}
                    onChange={handleChange}
                    placeholder="Required for drivers only"
                  />

                  <small className="text-muted">

                    Leave blank if not applicable.

                  </small>

                </div>

              </div>

            </div>

            {/* =============================
                EMERGENCY CONTACT
            ============================= */}

            <div className="form-section mt-5">

              <h5 className="section-title">

                <i className="bi bi-telephone-fill me-2"></i>

                Emergency Contact

              </h5>

              <div className="row g-4">

                <div className="col-lg-6">

                  <label className="form-label">

                    Contact Person

                  </label>

                  <input
                    type="text"
                    className="form-control"
                    name="emergency_contact_name"
                    value={form.emergency_contact_name}
                    onChange={handleChange}
                    placeholder="Full Name"
                  />

                </div>

                <div className="col-lg-6">

                  <label className="form-label">

                    Contact Number

                  </label>

                  <input
                    type="text"
                    className="form-control"
                    name="emergency_contact_number"
                    value={form.emergency_contact_number}
                    onChange={handleChange}
                    placeholder="09XXXXXXXXX"
                  />

                </div>

              </div>

            </div>

            {/* =============================
                ADDRESS INFORMATION
            ============================= */}

            <div className="form-section mt-5">

              <h5 className="section-title">

                <i className="bi bi-geo-alt-fill me-2"></i>

                Address Information

              </h5>

              <div className="row g-4">

                                <div className="col-lg-6">

                  <label className="form-label">
                    Street / House No.
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    name="street"
                    value={form.street}
                    onChange={handleChange}
                    placeholder="House No., Street"
                  />

                </div>

                <div className="col-lg-6">

                  <label className="form-label">
                    Barangay
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    name="barangay"
                    value={form.barangay}
                    onChange={handleChange}
                    placeholder="Barangay"
                  />

                </div>

                <div className="col-lg-6">

                  <label className="form-label">
                    City / Municipality
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Catbalogan City"
                  />

                </div>

                <div className="col-lg-6">

                  <label className="form-label">
                    Province
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    name="province"
                    value={form.province}
                    onChange={handleChange}
                    placeholder="Samar"
                  />

                </div>

              </div>

            </div>

            {/* =============================
                ACCOUNT INFORMATION
            ============================= */}

            <div className="form-section mt-5">

              <h5 className="section-title">

                <i className="bi bi-shield-lock-fill me-2"></i>

                Account Information

              </h5>

              <div className="row g-4">

                <div className="col-lg-6">

                  <label className="form-label">

                    Employee Access Code

                  </label>

                  <div className="input-group">

                    <input
                      type="text"
                      className="form-control"
                      name="access_code"
                      value={form.access_code}
                      readOnly
                    />

                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          access_code: generateAccessCode(),
                        }))
                      }
                    >

                      <i className="bi bi-arrow-repeat me-1"></i>

                      Generate

                    </button>

                  </div>

                  <small className="text-muted">

                    This code will be used by the employee to access the
                    HydroHub mobile application.

                  </small>

                </div>

                <div className="col-lg-6">

                  <label className="form-label">

                    Code Status

                  </label>

                  <select
                    className="form-select"
                    name="code_status"
                    value={form.code_status}
                    onChange={handleChange}
                  >

                    <option value="Activated">
                      Activated
                    </option>

                    <option value="Disabled">
                      Disabled
                    </option>

                  </select>

                </div>

              </div>

            </div>

          </div>

          {/* =============================
              MODAL FOOTER
          ============================= */}

                    <div className="employee-modal-footer d-flex justify-content-between align-items-center flex-wrap gap-3">

            <div className="text-muted small">

              <i className="bi bi-info-circle me-1"></i>

              Fields marked with
              <span className="text-danger fw-bold"> *</span>
              are required.

            </div>

            <div className="d-flex gap-2">

              <button
                type="button"
                className="btn btn-light"
                onClick={handleClose}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >

                {saving ? (

                  <>

                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    />

                    Saving...

                  </>

                ) : (

                  <>

                    <i className="bi bi-check-circle me-2"></i>

                    {employee
                      ? "Update Employee"
                      : "Save Employee"}

                  </>

                )}

              </button>

            </div>

          </div>

        </form>

      </div>

    </div>

  );

}
           