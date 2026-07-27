function Footer() {
  return (
    <div className="footer d-flex justify-content-between align-items-center flex-wrap gap-2">

      {/* LEFT */}
      <span className="text-muted footer-copy">
        © 2026 HydroHub. All rights reserved.
      </span>

      {/* RIGHT */}
      <div className="d-flex align-items-center gap-3 footer-links">

        <span className="text-muted small footer-version">
          Version 1.0
        </span>

        <a href="#" className="text-decoration-none small">
          Privacy
        </a>

        <a href="#" className="text-decoration-none small">
          Support
        </a>

      </div>

    </div>
  );
}

export default Footer;