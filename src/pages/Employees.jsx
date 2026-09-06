import { useEffect, useMemo, useState } from "react";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

import EmployeeTable from "../components/employees/EmployeeTable";
import EmployeeModal from "../components/employees/EmployeeModal";
import EmployeeDetailsDrawer from "../components/employees/EmployeeDetailsDrawer";

import {
  getEmployees,
  getEmployeeStats,
} from "../services/employees.service";

import "../styles/pages/employees.css";

export default function Employees() {

  /* ===========================
      STATE
  ============================ */

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);

  const [search, setSearch] = useState("");

  /* ===========================
      LOAD EMPLOYEES
  ============================ */

  async function loadEmployees() {

    try {

      setLoading(true);

      const data = await getEmployees();

      setEmployees(data ?? []);

    } catch (error) {

      console.error("Failed to load employees:", error);

    } finally {

      setLoading(false);

    }

  }

    useEffect(() => {
    let ignore = false;

    async function fetchEmployees() {
        try {
        setLoading(true);

        const data = await getEmployees();

        if (!ignore) {
            setEmployees(data ?? []);
        }
        } catch (error) {
        console.error("Failed to load employees:", error);
        } finally {
        if (!ignore) {
            setLoading(false);
        }
        }
    }

    fetchEmployees();

    return () => {
        ignore = true;
    };
    }, []);

    /* ===========================
      SEARCH
  ============================ */

  const filteredEmployees = useMemo(() => {

    if (!search.trim()) return employees;

    const keyword = search.toLowerCase();

    return employees.filter((employee) => {

      return (

        employee.name?.toLowerCase().includes(keyword) ||

        employee.email?.toLowerCase().includes(keyword) ||

        employee.phone?.toLowerCase().includes(keyword) ||

        employee.role?.toLowerCase().includes(keyword) ||

        employee.employee_id?.toLowerCase().includes(keyword)

      );

    });

  }, [employees, search]);

  /* ===========================
      MODAL
  ============================ */

  function handleAddEmployee() {

    setSelectedEmployee(null);

    setShowModal(true);

  }

  function handleEditEmployee(employee) {

    setSelectedEmployee(employee);

    setShowModal(true);

  }

  /* ===========================
      DRAWER
  ============================ */

  function handleViewEmployee(employee) {

    setSelectedEmployee(employee);

    setShowDrawer(true);

  }

  /* ===========================
      CLOSE
  ============================ */

  function closeModal() {

    setShowModal(false);

    setSelectedEmployee(null);

  }

  function closeDrawer() {

    setShowDrawer(false);

    setSelectedEmployee(null);

  }

  /* ===========================
      STATISTICS
  ============================ */

  const stats = useMemo(() => {

    return getEmployeeStats(employees);

  }, [employees]);

  /* ===========================
      LOADING
  ============================ */

  if (loading) {

    return (

      <div className="dashboard-page">

        <div className="d-flex">

          <Sidebar />

          <div className="main-content employees-main-content">

            <Header />

            <div
              className="d-flex justify-content-center align-items-center"
              style={{ height: "80vh" }}
            >

              <div className="text-center">

                <div
                  className="spinner-border text-primary mb-3"
                  role="status"
                >
                  <span className="visually-hidden">
                    Loading...
                  </span>
                </div>

                <p className="text-muted mb-0">
                  Loading employees...
                </p>

              </div>

            </div>

            <div className="employees-footer">
              <Footer />
            </div>

          </div>

        </div>

      </div>

    );

  }

  /* ===========================
      PAGE
  ============================ */

  return (

    <div className="dashboard-page">

      <div className="d-flex">

        <Sidebar />

        <div className="main-content employees-main-content">

          <Header />

          <section className="employees-page">

            <div className="container-fluid">

                        {/* ===========================
                PAGE HEADER
            ============================ */}

            <div className="employees-header mb-4">

              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">

                <div>

                  <span className="text-uppercase text-primary fw-semibold small">
                    Employee Management
                  </span>

                  <h4 className="mt-2 mb-2">
                    Employees
                  </h4>

                  <p className="text-muted mb-1">
                    Manage delivery personnel, office staff, and administrator accounts.
                  </p>

                </div>

                <button
                  className="btn btn-primary employee-add-btn"
                  onClick={handleAddEmployee}
                >

                  <i className="bi bi-person-plus-fill me-2"></i>

                  Add Employee

                </button>

              </div>

            </div>

            {/* ===========================
                TOOLBAR
            ============================ */}

            <div className="card employee-toolbar shadow-sm border-0 mb-4">
            <div className="card-body">

                <div className="employee-toolbar-content">

                <div className="employee-search">

                    <div className="input-group">

                    <span className="input-group-text bg-white border-end-0">
                        <i className="bi bi-search"></i>
                    </span>

                    <input
                        type="text"
                        className="form-control border-start-0"
                        placeholder="Search employees..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    </div>

                </div>

                <div className="employee-count">

                    <span>
                    Showing <strong>{filteredEmployees.length}</strong> of{" "}
                    <strong>{employees.length}</strong> employee(s)
                    </span>

                </div>

                </div>

            </div>
            </div>

            {/* ===========================
                STATISTICS
            ============================ */}

            <div className="row g-4 mb-4 employee-stat-grid">

              <div className="col-6 col-xl-3 employee-stat-col">

                <div className="stat-card employee-stat-card">

                  <div className="d-flex justify-content-between">

                    <div>

                      <small className="text-muted">
                        Total Employees
                      </small>

                      <h2>{stats.totalEmployees}</h2>

                    </div>

                    <div className="stat-icon bg-primary-subtle text-primary">

                      <i className="bi bi-people-fill"></i>

                    </div>

                  </div>

                </div>

              </div>

              <div className="col-6 col-xl-3 employee-stat-col">

                <div className="stat-card employee-stat-card">

                  <div className="d-flex justify-content-between">

                    <div>

                      <small className="text-muted">
                        Drivers
                      </small>

                      <h2>{stats.drivers}</h2>

                    </div>

                    <div className="stat-icon bg-success-subtle text-success">

                      <i className="bi bi-truck"></i>

                    </div>

                  </div>

                </div>

              </div>

              <div className="col-6 col-xl-3 employee-stat-col">

                <div className="stat-card employee-stat-card">

                  <div className="d-flex justify-content-between">

                    <div>

                      <small className="text-muted">
                        Staff
                      </small>

                      <h2>{stats.staff}</h2>

                    </div>

                    <div className="stat-icon bg-info-subtle text-info">

                      <i className="bi bi-person-workspace"></i>

                    </div>

                  </div>

                </div>

              </div>

              <div className="col-6 col-xl-3 employee-stat-col">

                <div className="stat-card employee-stat-card">

                  <div className="d-flex justify-content-between">

                    <div>

                      <small className="text-muted">
                        Inactive
                      </small>

                      <h2>{stats.inactive}</h2>

                    </div>

                    <div className="stat-icon bg-danger-subtle text-danger">

                      <i className="bi bi-person-x-fill"></i>

                    </div>

                  </div>

                </div>

              </div>

            </div>

            {/* ===========================
                EMPLOYEE DIRECTORY
            ============================ */}

            <div className="card employee-table-card shadow-sm border-0">

              <div className="card-header bg-white">

                <div className="d-flex justify-content-between align-items-center">

                  <div>

                    <h5 className="mb-1">
                      Employee Directory
                    </h5>

                    <small className="text-muted">
                      View and manage all registered employees.
                    </small>

                  </div>

                </div>

              </div>

              <div className="card-body p-0">

                <EmployeeTable
                  loading={loading}
                  employees={filteredEmployees}
                  onView={handleViewEmployee}
                />

              </div>

            </div>

            {/* ===========================
                EMPLOYEE MODAL
            ============================ */}

            <EmployeeModal
              key={selectedEmployee?.id ?? "new"}
              open={showModal}
              employee={selectedEmployee}
              onClose={closeModal}
              onSaved={loadEmployees}
            />

            {/* ===========================
                EMPLOYEE DETAILS DRAWER
            ============================ */}

            <EmployeeDetailsDrawer
                open={showDrawer}
                employee={selectedEmployee}
                onClose={closeDrawer}
                onEdit={handleEditEmployee}
                onRefresh={loadEmployees}
            />

          </div>

        </section>

        <div className="employees-footer">
          <Footer />
        </div>

      </div>

    </div>

    </div>
  );

}