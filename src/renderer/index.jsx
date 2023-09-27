import React from "react";
import { createRoot } from "react-dom/client";

const container = document.getElementById("target");
const root = createRoot(container);

root.render(<React.Fragment>Hello world</React.Fragment>);