import React from "react";
import { Outlet, Link } from "react-router-dom";

function Navbar() {
  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-info mt-3 p-3 shadow-sm">
        <div className="container-fluid">
          {/* Brand Name */}
          <Link className="navbar-brand fw-bold" to="/">
            🌐 LinguaTalk
          </Link>

          {/* Toggle button for mobile view */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarContent"
            aria-controls="navbarContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Nav Items */}
          <div className="collapse navbar-collapse" id="navbarContent">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0 gap-4">
              <li className="nav-item">
                <Link to="/add-friend" className="nav-link text-dark fw-semibold">
                  ➕ Add Friend
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/video" className="nav-link text-dark fw-semibold">
                  🎥 Start Call
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/notifications"
                  className="nav-link text-dark fw-semibold"
                >
                  🔔 Notifications
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/friends"
                  className="nav-link text-dark fw-semibold"
                >
                  👥 Friends
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/logout"
                  className="nav-link text-dark fw-bold"
                  style={{ fontSize: "18px" }}
                >
                  🚪 Logout
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Renders child routes here */}
      <Outlet />
    </>
  );
}

export default Navbar;
