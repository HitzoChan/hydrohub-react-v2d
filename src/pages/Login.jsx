import "@lottiefiles/lottie-player";
import "../styles/pages/login.css";

function Login() {
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

            <div className="form-group mb-3">

              <label className="form-label">
                Email
              </label>

              <input
                type="email"
                className="form-control"
                placeholder="Enter your email"
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
              />

            </div>

            <button className="btn btn-login w-100 mb-3">
              Login
            </button>

            <div
              id="error"
              className="text-danger small mb-3"
            ></div>

            <div className="d-flex justify-content-between align-items-center mb-3">

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