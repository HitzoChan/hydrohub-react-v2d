import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import "../styles/pages/login.css";
import logo from "../assets/images/logo.png";

import useAuth from "../hooks/useAuth";

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
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
                            Aqua en Lavada
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

                    <div className="hero-visual" aria-hidden="true">
                        <div className="gallon-art">
                            <span className="gallon-cap"></span>
                            <span className="gallon-label">PURE<br />WATER</span>
                            <span className="gallon-shine"></span>
                        </div>

                    </div>

                </div>

                {/* Login Form */}

                <div className="form-panel col-12 col-md-6 d-flex align-items-center justify-content-center">

                    <div className="login-card">

                        <div className="brand-block text-center mb-4">

                            <img className="logo" src={logo} alt="Aqua en Lavada" />

                            <h4>Welcome back</h4>

                            <p className="text-muted">
                                Sign in to keep your water station flowing.
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

                                <div className="password-field">

                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="form-control"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />

                                    <button
                                        type="button"
                                        className="password-toggle"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        title={showPassword ? "Hide password" : "Show password"}
                                        onClick={() => setShowPassword((visible) => !visible)}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>

                                </div>

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
                                {loading ? "Signing in..." : "Sign in to dashboard"}
                            </button>

                        </form>

                    </div>

                </div>

            </div>
        </div>
    );
}

export default Login;