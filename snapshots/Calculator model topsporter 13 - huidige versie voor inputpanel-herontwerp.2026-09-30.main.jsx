import React from "react";
import { createRoot } from "react-dom/client";
import InvestmentCalculator from "./InvestmentCalculator";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <InvestmentCalculator />
  </React.StrictMode>
);
