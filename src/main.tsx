import React from "react";
import ReactDOM from "react-dom/client";
import App from "../App"; // ajustá si App.tsx está en raíz
import "./index.css";     // si querés Tailwind compilado (opcional)

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
