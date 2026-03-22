import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  NavLink,
  Link,
  Outlet,
} from "react-router-dom";
import { Mail } from "lucide-react";

import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

import Home from "./pages/Home";
import Models from "./pages/Models";
import Templates from "./pages/Templates";
import Compose from "./pages/Compose";
import History from "./pages/History";
import Settings from "./pages/Settings";

const navLinks = [
  { to: "/",         label: "Home",        end: true },
  { to: "/models",   label: "Products" },
  { to: "/templates",label: "Templates" },
  { to: "/compose",  label: "Compose" },
  { to: "/history",  label: "Sent Emails" },
  { to: "/settings", label: "Settings" },
];

function Nav() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom mb-4"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div className="container-fluid px-4">
        <Link className="navbar-brand" to="/">
          <Mail size={18} strokeWidth={2.2} />
          Sales Mailer
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav">
            {navLinks.map(({ to, label, end }) => (
              <li className="nav-item" key={to}>
                <NavLink
                  className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                  to={to}
                  end={end}
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}

function Layout() {
  return (
    <>
      <Nav />
      <div className="container-fluid px-4 pb-5">
        <Outlet />
      </div>
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/",          element: <Home /> },
      { path: "/models",    element: <Models /> },
      { path: "/templates", element: <Templates /> },
      { path: "/compose",   element: <Compose /> },
      { path: "/history",   element: <History /> },
      { path: "/settings",  element: <Settings /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
