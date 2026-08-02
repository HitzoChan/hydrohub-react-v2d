import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "@lottiefiles/lottie-player";
import "../styles/pages/login.css";

import useAuth from "../hooks/useAuth";

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleLogin(e) {
        e.preventDefault();

        setError("");

        if (!email || !password) {
            setError("Please enter your email and password.");
            return;
        }

        setLoading(true);

        try {
            const result = await login(email, password);

            if (result.success) {
                navigate("/dashboard");
            } else {
                setError("Invalid email or password.");
            }
        } catch (err) {
            console.error(err);
            setError("Unable to login. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page d-flex align-items-center justify-content-center">
            <div className="auth-panel row gx-0 shadow-lg">

                {/* Left Hero Panel */}
                <div className="hero-panel col-md-6 d-none d-md-flex align-items-center">

                    <div className="hero-content">

                        <span className="eyebrow">
                            Aqua en Lavaba
                        </span>

                        <h1>
                            Pure water. Fresh start.
                        </h1>

                        <p>
                            Clean, modern login designed for your refilling station.
                            Secure admin access for your operations.
                        </p>

                        <div className="hero-features">

                            <div className="feature-item">
                                Fast access to daily operations
                            </div>

                            <div className="feature-item">
                                Secure supervision and reporting
                            </div>

                        </div>

                    </div>

                    <div className="hero-visual">

                        <lottie-player
                            src="https://assets10.lottiefiles.com/packages/lf20_w51pcehl.json"
                            background="transparent"
                            speed="1"
                            style={{ width: "320px" }}
                            loop
                            autoPlay
                        ></lottie-player>

                    </div>

                </div>

                {/* Login Form */}

                <div className="form-panel col-12 col-md-6 d-flex align-items-center justify-content-center">

                    <div className="login-card">

                        <div className="brand-block text-center mb-4">

                            <h4>Admin Login</h4>

                            <p className="text-muted">
                                Enter your admin credentials to access the dashboard
                            </p>

                        </div>

                        <form onSubmit={handleLogin}>

                            <div className="form-group mb-3">

                                <label className="form-label">
                                    Email
                                </label>

                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />

                            </div>

                            <div className="form-group mb-3">

                                <label className="form-label">
                                    Password
                                </label>

                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />

                            </div>

                            {error && (
                                <div className="alert alert-danger py-2">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn btn-login w-100 mb-3"
                                disabled={loading}
                            >
                                {loading ? "Logging in..." : "Login"}
                            </button>

                        </form>

                        <div className="d-flex justify-content-between align-items-center">

                            <a href="#" className="text-muted small">
                                Forgot Password?
                            </a>

                            <a href="#" className="text-muted small">
                                Create Account
                            </a>

                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
}

export default Login;