import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

export default function AccountSettings({
    settings,
    setSettings
}) {
    const navigate = useNavigate();
    const { logout } = useAuth();

    function handleChange(e) {
        const { name, value } = e.target;

        setSettings(prev => ({
            ...prev,
            [name]: value
        }));
    }

    function handleLogout() {
        const confirmed = window.confirm(
            "Are you sure you want to logout?"
        );

        if (!confirmed) return;

        logout();

        navigate("/login", {
            replace: true
        });
    }

    return (
        <>
            <div className="card shadow-sm border-0 mb-4">

                <div className="card-header bg-white">

                    <h5 className="mb-1">
                        Administrator Account
                    </h5>

                    <small className="text-muted">
                        Manage your administrator account information.
                    </small>

                </div>

                <div className="card-body">

                    <div className="row g-3">

                        <div className="col-md-6">

                            <label className="form-label fw-semibold">
                                Administrator Name
                            </label>

                            <input
                                type="text"
                                className="form-control"
                                name="adminName"
                                value={settings.adminName}
                                onChange={handleChange}
                                placeholder="Administrator Name"
                            />

                        </div>

                        <div className="col-md-6">

                            <label className="form-label fw-semibold">
                                Email Address
                            </label>

                            <input
                                type="email"
                                className="form-control"
                                name="adminEmail"
                                value={settings.adminEmail}
                                onChange={handleChange}
                                placeholder="Email Address"
                            />

                        </div>

                        <div className="col-12">

                            <label className="form-label fw-semibold">
                                New Password
                            </label>

                            <input
                                type="password"
                                className="form-control"
                                name="adminPassword"
                                value={settings.adminPassword || ""}
                                onChange={handleChange}
                                placeholder="Leave blank to keep your current password"
                            />

                            <small className="text-muted">
                                Leave this field blank if you do not want to change your password.
                            </small>

                        </div>

                    </div>

                </div>

            </div>

            <div className="card shadow-sm border-0 mb-4">

                <div className="card-header bg-light">

                    <h6 className="mb-0">
                        Account Summary
                    </h6>

                </div>

                <div className="card-body">

                    <div className="d-flex justify-content-between mb-3">

                        <span>Administrator</span>

                        <strong>
                            {settings.adminName || "Not Set"}
                        </strong>

                    </div>

                    <div className="d-flex justify-content-between">

                        <span>Email Address</span>

                        <strong>
                            {settings.adminEmail || "Not Set"}
                        </strong>

                    </div>

                </div>

            </div>

            <div className="card border-danger shadow-sm">

                <div className="card-header bg-danger text-white">

                    <h6 className="mb-0">
                        Danger Zone
                    </h6>

                </div>

                <div className="card-body">

                    <p className="text-muted mb-4">
                        Logging out will end your current administrator session.
                        You will need to sign in again to continue using HydroHub.
                    </p>

                    <button
                        className="btn btn-danger"
                        onClick={handleLogout}
                    >
                        <i className="bi bi-box-arrow-right me-2"></i>
                        Logout Account
                    </button>

                </div>

            </div>
        </>
    );
}