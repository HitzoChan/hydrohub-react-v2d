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

        <div className="main-content customers-main-content">

          <Header />

          {/* Page Header */}

          <div className="customer-page-header d-flex justify-content-between align-items-start mb-4">

            <div>

              <h2 className="page-title">

                <i className="bi bi-people-fill me-2"></i>

                Customer Management

              </h2>

              <p className="text-muted mb-0">

                Manage and view all customer information.

              </p>

            </div>

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

          <div className="customers-footer">
            <Footer />
          </div>

        </div>

      </div>

    </div>

  );

}

export default Customers;