import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  NavLink,
  Link,
  Outlet,
} from "react-router-dom";
import { Mail, LogOut } from "lucide-react";

import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

import Home from "./pages/Home";
import Models from "./pages/Models";
import Templates from "./pages/Templates";
import Compose from "./pages/Compose";
import History from "./pages/History";
import Settings from "./pages/Settings";
import SignIn from "./pages/SignIn";
import { AccountProvider, useAccount } from "./lib/AccountContext";

const navLinks = [
  { to: "/",         label: "Home",        end: true },
  { to: "/models",   label: "Products" },
  { to: "/templates",label: "Templates" },
  { to: "/compose",  label: "Compose" },
  { to: "/history",  label: "Sent Emails" },
  { to: "/settings", label: "Settings" },
];

function Nav() {
  const { account, signOut } = useAccount();
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom mb-4"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div className="container-fluid px-4 px-lg-5">
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
          {account && (
            <div className="d-flex align-items-center gap-3 ms-lg-auto">
              <span className="text-muted">{account.email}</span>
              <button onClick={signOut} className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1">
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function SignedOutNav() {
  return (
    <nav className="navbar navbar-light bg-white border-bottom mb-4"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div className="container-fluid px-4 px-lg-5">
        <span className="navbar-brand">
          <Mail size={18} strokeWidth={2.2} />
          Sales Mailer
        </span>
      </div>
    </nav>
  );
}

function Layout() {
  const { account } = useAccount();

  // Every page needs an account. Signed-out visitors only see the sign-in screen.
  if (!account) {
    return (
      <>
        <SignedOutNav />
        <div className="container-fluid px-4 px-lg-5 pb-5">
          <SignIn />
        </div>
      </>
    );
  }

  return (
    <>
      <Nav />
      <div className="container-fluid px-4 px-lg-5 pb-5">
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
    <AccountProvider>
      <RouterProvider router={router} />
    </AccountProvider>
  </React.StrictMode>
);
