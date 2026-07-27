import { useState } from "react";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

import CustomerFilters from "../components/customers/CustomerFilters";
import CustomerStats from "../components/customers/CustomerStats";
import CustomersTable from "../components/customers/CustomersTable";

import "../styles/pages/customers.css";

function Customers() {

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  return (

    <div className="dashboard-page">

      <div className="d-flex">

        {/* Sidebar */}

        <Sidebar />

        {/* Main Content */}

        <div className="main-content">

          <Header />

          {/* Page Header */}

          <div className="d-flex justify-content-between align-items-center mb-4">

            <div>

              <h2 className="page-title">

                <i className="bi bi-people-fill me-2"></i>

                Customer Management

              </h2>

              <p className="text-muted mb-0">

                Manage and view all customer information.

              </p>

            </div>

            <button className="btn btn-dark">

              <i className="bi bi-download me-2"></i>

              Export List

            </button>

          </div>

          {/* Statistics */}

          <CustomerStats />

          {/* Search & Filter */}

          <CustomerFilters
            search={search}
            setSearch={setSearch}
            status={status}
            setStatus={setStatus}
          />

          {/* Customers Table */}

          <CustomersTable
            search={search}
            status={status}
          />

          <Footer />

        </div>

      </div>

    </div>

  );

}

export default Customers;