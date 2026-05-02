import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/context/AuthContext";
import kipImg from "../../../assets/kip.png";
import "./ChildIntroPage.css";

export default function ChildIntroLoading() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Set introSeen so next login skips intro
    if (user?._id) {
      localStorage.setItem(`introSeen_${user._id}`, "true");
    }

    // Auto-navigate to placement test after loading animation
    const timer = setTimeout(() => {
      navigate("/child/placement", { replace: true });
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate, user]);

  return (
    <div className="intro-loading">
      <div className="intro-loading-content">
        <div className="intro-loading-kip">
          <img src={kipImg} alt="Kip loading" />
        </div>
        <p className="intro-loading-text">Loading...</p>
      </div>
    </div>
  );
}
