import React from "react";
import "./index.css";
import Home from "./pages/Home";
import AuthGate from "./components/AuthGate";

export default function App() {
  return (
    <AuthGate>
      <Home />
    </AuthGate>
  );
}
