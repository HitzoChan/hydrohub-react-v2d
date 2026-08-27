import { Routes, Route, Navigate } from "react-router-dom";

// ============================================================
// PAGES
// ============================================================

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Reservations from "./pages/Reservations";
import Deliveries from "./pages/Deliveries";
import Employees from "./pages/Employees";
import Customers from "./pages/Customers";
import MapMonitoring from "./pages/MapMonitoring";
import Messaging from "./pages/Messaging";
import Inventory from "./pages/Inventory";
import Expenses from "./pages/Expenses";
import Feedback from "./pages/Feedback";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

// ============================================================
// PROTECTED ROUTE
// ============================================================

import ProtectedRoute from "./routes/ProtectedRoute";

// ============================================================
// 404 PAGE
// ============================================================

function NotFound() {
    return (
        <div className="container py-5 text-center">

            <h1 className="display-5 fw-bold">
                404
            </h1>

            <p className="text-muted">
                The page you're looking for doesn't exist.
            </p>

        </div>
    );
}

// ============================================================
// APP
// ============================================================

function App() {
    return (
        <Routes>

            {/* ==================================================
                DEFAULT ROUTE
            ================================================== */}

            <Route
                path="/"
                element={
                    <Navigate
                        to="/login"
                        replace
                    />
                }
            />


            {/* ==================================================
                LOGIN
            ================================================== */}

            <Route
                path="/login"
                element={<Login />}
            />


            {/* ==================================================
                DASHBOARD
            ================================================== */}

            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />


            {/* ==================================================
                ORDERS
            ================================================== */}

            <Route
                path="/orders"
                element={
                    <ProtectedRoute>
                        <Orders />
                    </ProtectedRoute>
                }
            />


            {/* ==================================================
                RESERVATIONS
            ================================================== */}

            <Route
                path="/reservations"
                element={
                    <ProtectedRoute>
                        <Reservations />
                    </ProtectedRoute>
                }
            />


            {/* ==================================================
                DELIVERIES
            ================================================== */}

            <Route
                path="/deliveries"
                element={
                    <ProtectedRoute>
                        <Deliveries />
                    </ProtectedRoute>
                }
            />


            {/* ==================================================
                CUSTOMERS
            ================================================== */}

            <Route
                path="/customers"
                element={
                    <ProtectedRoute>
                        <Customers />
                    </ProtectedRoute>
                }
            />


            {/* ==================================================
                INVENTORY
            ================================================== */}

            <Route
                path="/inventory"
                element={
                    <ProtectedRoute>
                        <Inventory />
                    </ProtectedRoute>
                }
            />


            {/* ==================================================
                EXPENSES
            ================================================== */}

            <Route
                path="/expenses"
                element={
                    <ProtectedRoute>
                        <Expenses />
                    </ProtectedRoute>
                }
            />


            {/* ==================================================
                FEEDBACK
            ================================================== */}

            <Route
                path="/feedback"
                element={
                    <ProtectedRoute>
                        <Feedback />
                    </ProtectedRoute>
                }
            />


            {/* ==================================================
                REPORTS
            ================================================== */}

            <Route
                path="/reports"
                element={
                    <ProtectedRoute>
                        <Reports />
                    </ProtectedRoute>
                }
            />


            {/* ==================================================
                EMPLOYEES
            ================================================== */}

            <Route
                path="/employees"
                element={
                    <ProtectedRoute>
                        <Employees />
                    </ProtectedRoute>
                }
            />


            {/* ==================================================
                MAP MONITORING
            ================================================== */}

            <Route
                path="/map"
                element={
                    <ProtectedRoute>
                        <MapMonitoring />
                    </ProtectedRoute>
                }
            />


            {/* ==================================================
                MESSAGING
            ================================================== */}

            <Route
                path="/messaging"
                element={
                    <ProtectedRoute>
                        <Messaging />
                    </ProtectedRoute>
                }
            />


            {/* ==================================================
                SETTINGS
            ================================================== */}

            <Route
                path="/settings"
                element={
                    <ProtectedRoute>
                        <Settings />
                    </ProtectedRoute>
                }
            />


            {/* ==================================================
                404
            ================================================== */}

            <Route
                path="*"
                element={<NotFound />}
            />

        </Routes>
    );
}

export default App;