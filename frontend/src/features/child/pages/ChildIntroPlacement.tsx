import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import kipImg from "../../../assets/kip_b.png";
import "./ChildIntroPage.css";

export default function ChildIntroPlacement() {
  const navigate = useNavigate();

  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleStart = () => {
    navigate("/child/intro/loading", { replace: true });
  };

  const handleBack = () => {
    navigate("/child/intro/find-level", { replace: true });
  };

  return (
    <div className={`intro-page ${show ? "intro-page--visible" : ""}`}>
      <div className="intro-card intro-card--placement">
        {/* Progress bar */}
        <div className="intro-progress">
          <button className="intro-back" onClick={handleBack} aria-label="Go back">
            ‹
          </button>
          <div className="intro-progress-track">
            <div className="intro-progress-fill" style={{ width: "90%" }} />
          </div>
        </div>

        {/* Kip with book + speech bubble */}
        <div className="intro-placement-content">
          <div className="intro-kip intro-kip--medium">
            <img src={kipImg} alt="Kip reading" />
          </div>
          <div className="intro-bubble intro-bubble--right">
            <span>
              You have to do small placement test, from it you can find your level
              and go ahead from your level to advance!
            </span>
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div className="intro-footer">
        <button className="intro-continue" onClick={handleStart}>
          Let's start
        </button>
      </div>
    </div>
  );
}
