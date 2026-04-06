import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import kipImg from "../../../assets/kip.png";
import "./ChildIntroPage.css";

export default function ChildIntroFindLevel() {
  const navigate = useNavigate();

  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleContinue = () => {
    navigate("/child/intro/placement", { replace: true });
  };

  const handleBack = () => {
    navigate("/child/intro/achievements", { replace: true });
  };

  return (
    <div className={`intro-page ${show ? "intro-page--visible" : ""}`}>
      <div className="intro-card intro-card--achievements">
        {/* Progress bar */}
        <div className="intro-progress">
          <button className="intro-back" onClick={handleBack} aria-label="Go back">
            ‹
          </button>
          <div className="intro-progress-track">
            <div className="intro-progress-fill" style={{ width: "75%" }} />
          </div>
        </div>

        {/* Kip + speech bubble row */}
        <div className="intro-achieve-header">
          <div className="intro-kip intro-kip--small">
            <img src={kipImg} alt="Kip the dinosaur" />
          </div>
          <div className="intro-bubble intro-bubble--left">
            <span>Now, Let's find the best place to start</span>
          </div>
        </div>

        {/* Find my level card — centered */}
        <div className="intro-level-wrapper">
          <div className="intro-level-card">
            <div className="intro-level-icon">📊</div>
            <div className="intro-achieve-text">
              <strong>Find my level</strong>
              <span>A quick quiz to see where you shine and where to begin!</span>
            </div>
          </div>
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
