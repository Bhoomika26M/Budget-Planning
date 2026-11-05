import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { SCREEN_PATHS } from "../data/navigation";

/** navigate("savings") style helper used by the screens (maps to URL paths). */
export default function useScreenNavigate() {
  const navigate = useNavigate();
  return useCallback((screen) => navigate(SCREEN_PATHS[screen] ?? "/"), [navigate]);
}
