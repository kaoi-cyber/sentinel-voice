"use client";

// Crypto Safety Quiz — generated with U-bot (U-topia) in U-Code mode, then reviewed and
// integrated by the Sentinel Voice team. Changes from the original: TypeScript types,
// scoped styles, and shuffled answers (U-bot's version always put the right answer first).
import { useEffect, useState } from "react";
import "./ubot-quiz.css";

const QUESTIONS: { q: string; answers: string[]; correct: number; explanation: string }[] = [
  {
    q: "A support agent DMs you and asks for your 12-word recovery phrase to \"fix your account\". You…",
    answers: [
      "Refuse: real support never asks for it",
      "Share it, they're official",
      "Share only the first 6 words"
    ],
    correct: 0,
    explanation: "Anyone with your recovery phrase controls your wallet; no real company ever asks for it."
  },
  {
    q: "A site offers a free airdrop if you approve \"unlimited USDC\". The safest move is…",
    answers: [
      "Don't approve; free-airdrop approvals are a common drain trick",
      "Approve, it's free",
      "Approve then revoke later"
    ],
    correct: 0,
    explanation: "Unlimited approvals let the spender take your whole balance, any time."
  },
  {
    q: "What does an \"unlimited token approval\" allow?",
    answers: [
      "The app can move all of that token, now or later",
      "One payment only",
      "Nothing until you click again"
    ],
    correct: 0,
    explanation: "It lasts until you revoke it."
  },
  {
    q: "You're asked to sign a \"gasless\" message to check out. Why be careful?",
    answers: [
      "Permit signatures can grant spending rights without a transaction",
      "Messages are always harmless",
      "Gasless means free money"
    ],
    correct: 0,
    explanation: "Permit and Permit2 signatures are a common way wallets get drained."
  },
  {
    q: "An address in your history matches the first and last characters of your savings wallet. What could it be?",
    answers: [
      "Address poisoning — check every character",
      "A backup address",
      "A faster route"
    ],
    correct: 0,
    explanation: "Scammers plant look-alike addresses hoping you copy the wrong one."
  },
  {
    q: "Best place to type an exchange's website?",
    answers: [
      "Type it yourself or use the official app",
      "A link from an ad",
      "A link in a DM"
    ],
    correct: 0,
    explanation: "Cloned exchange sites are a top phishing method."
  },
  {
    q: "Which 2FA is strongest for an exchange account?",
    answers: [
      "Authenticator app",
      "SMS code",
      "No 2FA"
    ],
    correct: 0,
    explanation: "SIM-swap attacks can steal SMS codes."
  },
  {
    q: "Bitcoin fell about 75% from its 2017 high. What does that teach?",
    answers: [
      "Crypto can drop sharply; only invest what you can leave untouched",
      "Prices only go up",
      "It means it's a scam"
    ],
    correct: 0,
    explanation: "Big drops have happened many times."
  },
  {
    q: "A platform promises a guaranteed 20% monthly return. This is…",
    answers: [
      "A major red flag",
      "A great deal",
      "Normal for crypto"
    ],
    correct: 0,
    explanation: "Guaranteed high returns are a classic scam sign."
  },
  {
    q: "Before signing any wallet request you don't understand, you should…",
    answers: [
      "Check it with a tool like Sentinel or don't sign",
      "Sign quickly",
      "Ask the website to explain"
    ],
    correct: 0,
    explanation: "Never sign something you can't read."
  }
];

function getResultLabel(score: number) {
  if (score >= 9) return { label: "Crypto Guardian 🛡️", color: "#edb541" };
  if (score >= 6) return { label: "Getting There 📈", color: "#4f7cff" };
  return { label: "Keep Learning 📚", color: "#8b5cf6" };
}

export function UbotQuiz() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  // Display order of answers per question; shuffled after mount so server and client HTML match.
  const [orders, setOrders] = useState<number[][]>(() => QUESTIONS.map((q) => q.answers.map((_, i) => i)));
  useEffect(() => setOrders(shuffledOrders()), []);

  const question = QUESTIONS[current];
  const total = QUESTIONS.length;
  const progress = ((current) / total) * 100;

  function handleAnswer(idx: number) {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === question.correct) setScore(s => s + 1);
  }

  function handleNext() {
    if (current + 1 >= total) {
      setFinished(true);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
    }
  }

  function handleRestart() {
    setOrders(shuffledOrders());
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  }

  const result = getResultLabel(score);

  return (
    <div className="ubot-quiz"><div className="app-root">
      <div className="app-inner">
        {/* Header */}
        <div className="header">
          <div className="logo-row">
            <span className="shield">🛡️</span>
            <span className="app-title">Sentinel Voice</span>
          </div>
          <div className="app-subtitle">Crypto Safety Quiz</div>
        </div>

        {finished ? (
          <div className="card result-card">
            <div className="result-score">
              <span className="score-num" style={{ color: result.color }}>{score}</span>
              <span className="score-denom">/ {total}</span>
            </div>
            <div className="result-label" style={{ color: result.color }}>{result.label}</div>
            <div className="result-msg">
              {score >= 9
                ? "Outstanding! You have sharp instincts for crypto safety."
                : score >= 6
                ? "Solid effort — a few more concepts to lock down."
                : "Every expert started here. Review the explanations and try again!"}
            </div>
            <button className="btn-next" onClick={handleRestart}>Try Again</button>
          </div>
        ) : (
          <div className="card quiz-card">
            {/* Progress */}
            <div className="progress-row">
              <span className="progress-label">Question {current + 1} of {total}</span>
              <span className="progress-label">{score} correct</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Question */}
            <div className="question-text">{question.q}</div>

            {/* Answers */}
            <div className="answers">
              {orders[current].map((idx, pos) => {
                const ans = question.answers[idx];
                let cls = "btn-answer";
                if (selected !== null) {
                  if (idx === question.correct) cls += " correct";
                  else if (idx === selected) cls += " wrong";
                  else cls += " dimmed";
                }
                return (
                  <button
                    key={idx}
                    className={cls}
                    onClick={() => handleAnswer(idx)}
                    disabled={selected !== null}
                  >
                    <span className="ans-letter">{["A","B","C"][pos]}</span>
                    <span className="ans-text">{ans}</span>
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {selected !== null && (
              <div className={`feedback ${selected === question.correct ? "feedback-correct" : "feedback-wrong"}`}>
                <span className="feedback-icon">
                  {selected === question.correct ? "✅" : "❌"}
                </span>
                <span className="feedback-verdict">
                  {selected === question.correct ? "Correct! " : "Not quite. "}
                </span>
                <span className="feedback-explanation">{question.explanation}</span>
              </div>
            )}

            {selected !== null && (
              <button className="btn-next" onClick={handleNext}>
                {current + 1 >= total ? "See Results" : "Next"} →
              </button>
            )}
          </div>
        )}

        <footer className="footer">
          Educational only — not financial advice.<br />
          Built with U-bot for <strong>Sentinel Voice</strong> · U-Hackathon 2026
        </footer>
      </div>
    </div></div>
  );
}

function shuffledOrders(): number[][] {
  return QUESTIONS.map((q) => {
    const order = q.answers.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  });
}
