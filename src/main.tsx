import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Link,
  Outlet,
} from "react-router-dom";

import Home from "./pages/Home";
import Models from "./pages/Models";
import Templates from "./pages/Templates";
import Compose from "./pages/Compose";
import History from "./pages/History";
import Settings from "./pages/Settings";

function Nav() {
  return (
    <nav
      style={{ padding: 12, borderBottom: "1px solid #ddd", marginBottom: 12 }}
    >
      <Link to="/" style={{ marginRight: 12 }}>
        Home
      </Link>
      <Link to="/models" style={{ marginRight: 12 }}>
        Models
      </Link>
      <Link to="/templates" style={{ marginRight: 12 }}>
        Templates
      </Link>
      <Link to="/compose" style={{ marginRight: 12 }}>
        Compose
      </Link>
      <Link to="/history" style={{ marginRight: 12 }}>
        History
      </Link>
      <Link to="/settings">Settings</Link>
    </nav>
  );
}

// Layout is rendered BY the router, so Nav + children are inside router context
function Layout() {
  return (
    <>
      <Nav />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/models", element: <Models /> },
      { path: "/templates", element: <Templates /> },
      { path: "/compose", element: <Compose /> },
      { path: "/history", element: <History /> },
      { path: "/settings", element: <Settings /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
