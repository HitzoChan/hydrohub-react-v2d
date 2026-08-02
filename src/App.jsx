import { Routes, Route, Navigate } from "react-router-dom";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Deliveries from "./pages/Deliveries";
import Employees from "./pages/Employees";
import Customers from "./pages/Customers";
import MapMonitoring from "./pages/MapMonitoring";
import Messaging from "./pages/Messaging";
import Settings from "./pages/Settings";

// Protected Route
import ProtectedRoute from "./routes/ProtectedRoute";

function NotFound() {
    return (
        <div className="container py-5 text-center">
            <h1 className="display-5 fw-bold">404</h1>

            <p className="text-muted">
                The page you're looking for doesn't exist.
            </p>
        </div>
    );
}

function App() {
    return (
        <Routes>

            {/* Default Route */}
            <Route
                path="/"
                element={<Navigate to="/login" replace />}
            />

            {/* Login */}
            <Route
                path="/login"
                element={<Login />}
            />

            {/* Dashboard */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />

            {/* Orders */}
            <Route
                path="/orders"
                element={
                    <ProtectedRoute>
                        <Orders />
                    </ProtectedRoute>
                }
            />

            {/* Deliveries */}
            <Route
                path="/deliveries"
                element={
                    <ProtectedRoute>
                        <Deliveries />
                    </ProtectedRoute>
                }
            />

            {/* Employees */}
            <Route
                path="/employees"
                element={
                    <ProtectedRoute>
                        <Employees />
                    </ProtectedRoute>
                }
            />

            {/* Customers */}
            <Route
                path="/customers"
                element={
                    <ProtectedRoute>
                        <Customers />
                    </ProtectedRoute>
                }
            />

            {/* Map Monitoring */}
            <Route
                path="/map"
                element={
                    <ProtectedRoute>
                        <MapMonitoring />
                    </ProtectedRoute>
                }
            />

            {/* Messaging */}
            <Route
                path="/messaging"
                element={
                    <ProtectedRoute>
                        <Messaging />
                    </ProtectedRoute>
                }
            />

            {/* Settings */}
            <Route
                path="/settings"
                element={
                    <ProtectedRoute>
                        <Settings />
                    </ProtectedRoute>
                }
            />

            {/* 404 */}
            <Route
                path="*"
                element={<NotFound />}
            />

        </Routes>
    );
}

export default App;