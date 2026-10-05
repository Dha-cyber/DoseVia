import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initCapacitor } from "@/lib/capacitor-init";
import { runFreshDatabaseMigration } from "@/lib/storage";

runFreshDatabaseMigration();

void initCapacitor();

createRoot(document.getElementById("root")!).render(<App />);
