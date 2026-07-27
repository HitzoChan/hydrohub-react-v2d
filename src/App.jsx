import { Routes, Route, Navigate } from "react-router-dom";

// Pages
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Deliveries from "./pages/Deliveries";
import Customers from "./pages/Customers";
import MapMonitoring from "./pages/MapMonitoring";
import Messaging from "./pages/Messaging";

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

      {/* Redirect Home */}
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={<Dashboard />}
      />

      {/* Orders */}
      <Route
        path="/orders"
        element={<Orders />}
      />

      {/* Deliveries */}
      <Route
        path="/deliveries"
        element={<Deliveries />}
      />

      {/* Customers */}
      <Route
        path="/customers"
        element={<Customers />}
      />

      {/* Map Monitoring */}
      <Route
        path="/map"
        element={<MapMonitoring />}
      />

      {/* Messaging */}
      <Route
        path="/messaging"
        element={<Messaging />}
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