import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import Home from "./pages/Home";
import Products from "./pages/Products";
import CommunityPortal, { AdminPanel } from "./pages/CommunityPortal";

const path = window.location.pathname;
const Root =
  path.startsWith("/community/admin") ? AdminPanel :
  path.startsWith("/community")       ? CommunityPortal :
  path.startsWith("/mixology")        ? App :
  path.startsWith("/products")        ? Products :
  Home;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
