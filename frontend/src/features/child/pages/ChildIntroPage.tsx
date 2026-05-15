import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/context/AuthContext";
import kipImg from "../../../assets/Bye.png";
import "./ChildIntroPage.css";

export default function ChildIntroPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const childName = user?.name ?? "Friend";

  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleContinue = () => {
    navigate("/child/intro/achievements", { replace: true });
  };

  return (
    <div className={`intro-page ${show ? "intro-page--visible" : ""}`}>
      {/* Main card area */}
      <div className="intro-card">
        {/* Speech bubble */}
        <div className="intro-bubble">
          <span>Hi {childName}! I'm Kip</span>
        </div>

        {/* Kip mascot — BIG */}
        <div className="intro-kip intro-kip--big">
          <img src={kipImg} alt="Kip the dinosaur" />
        </div>
      </div>

      {/* Footer bar */}
      <div className="intro-footer">
        <button className="intro-continue" onClick={handleContinue}>
          CONTINUE
        </button>
      </div>
    </div>
  );
}
