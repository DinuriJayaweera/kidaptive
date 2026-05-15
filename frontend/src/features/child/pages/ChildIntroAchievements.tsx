import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import kipImg from "../../../assets/Star hold.png";
import "./ChildIntroPage.css";

const ACHIEVEMENTS = [
  {
    icon: "🏆",
    title: "Earn Trophies & Badges",
    desc: "Complete lessons and quizzes to collect shiny rewards!",
  },
  {
    icon: "⭐",
    title: "Level Up Your Skills",
    desc: "Practice every day and watch your level grow higher!",
  },
  {
    icon: "🎯",
    title: "Master New Topics",
    desc: "From nouns to tenses — become a grammar superstar!",
  },
];

export default function ChildIntroAchievements() {
  const navigate = useNavigate();

  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleContinue = () => {
    navigate("/child/intro/find-level", { replace: true });
  };

  const handleBack = () => {
    navigate("/child/intro", { replace: true });
  };

  return (
    <div className={`intro-page ${show ? "intro-page--visible" : ""}`}>
      {/* Main card area */}
      <div className="intro-card intro-card--achievements">
        {/* Progress bar */}
        <div className="intro-progress">
          <button className="intro-back" onClick={handleBack} aria-label="Go back">
            ‹
          </button>
          <div className="intro-progress-track">
            <div className="intro-progress-fill w-50" />
          </div>
        </div>

        {/* Kip + speech bubble row */}
        <div className="intro-achieve-header">
          <div className="intro-kip intro-kip--medium">
            <img src={kipImg} alt="Kip the dinosaur" />
          </div>
          <div className="intro-bubble intro-bubble--left">
            <span>Here's what you can achieve!</span>
          </div>
        </div>

        {/* Achievement list */}
        <div className="intro-achieve-list">
          {ACHIEVEMENTS.map((a, i) => (
            <div
              key={i}
              className={`intro-achieve-item delay-${i}`}
            >
              <div className="intro-achieve-icon">{a.icon}</div>
              <div className="intro-achieve-text">
                <strong>{a.title}</strong>
                <span>{a.desc}</span>
              </div>
            </div>
          ))}
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
