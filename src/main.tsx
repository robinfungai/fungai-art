import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import CommunityPortal from "./pages/CommunityPortal";

const path = window.location.pathname;
const Root = path.startsWith("/community") ? CommunityPortal : App;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
