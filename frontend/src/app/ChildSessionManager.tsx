import { useEffect } from "react";
import { useAuth } from "../features/auth/context/AuthContext";
import { startScreenTime, stopScreenTime } from "../features/child/services/screenTimeService";

/**
 * Mounts once at the app root. Starts screen-time tracking when the
 * authenticated user is a child and stops it on logout or role change.
 * Renders nothing.
 */
export default function ChildSessionManager() {
  const { isAuthenticated, role } = useAuth();

  useEffect(() => {
    if (isAuthenticated && role === "child") {
      startScreenTime();
      return () => {
        stopScreenTime();
      };
    }
  }, [isAuthenticated, role]);

  return null;
}
