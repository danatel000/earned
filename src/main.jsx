import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

if (!window.storage) {
  window.storage = {
    async list() {
      return {
        keys: Object.keys(localStorage).map((key) => ({ key })),
      };
    },
    async get(key) {
      const value = localStorage.getItem(key);
      return value == null ? null : { key, value };
    },
    async set(key, value) {
      localStorage.setItem(key, value);
      return { key, value };
    },
    async delete(key) {
      localStorage.removeItem(key);
      return { key };
    },
  };
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Offline app shell could not be registered.", error);
    });
  });
}
