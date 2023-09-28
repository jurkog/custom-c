import React from "react";
import { createRoot } from "react-dom/client";

import "./index.scss";
import App from "./App";
const container = document.getElementById("target");
const root = createRoot(container);

root.render(<React.Fragment><App  /></React.Fragment>);