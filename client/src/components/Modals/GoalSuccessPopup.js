import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CheckCircle, X } from "lucide-react";
import confetti from "canvas-confetti";

// ── Goal Success Popup ─────────────────────────────────────────────
export default function GoalSuccessPopup({ goal, onClose }) {
  const [barPct, setBarPct] = useState(0);

  // Fire confetti + animate progress bar on mount
  useEffect(() => {
    const fire = (opts) =>
      confetti({
        disableForReducedMotion: true,
        ...opts,
      });
    fire({
      particleCount: 80,
      spread: 60,
      origin: {
        y: 0.55,
      },
      colors: [goal.color, "#22c55e", "#fbbf24", "#fff"],
    });
    setTimeout(
      () =>
        fire({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: {
            x: 0,
            y: 0.6,
          },
          colors: [goal.color, "#f472b6", "#fff"],
        }),
      200,
    );
    setTimeout(
      () =>
        fire({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: {
            x: 1,
            y: 0.6,
          },
          colors: [goal.color, "#60a5fa", "#fff"],
        }),
      400,
    );
    const t = setTimeout(() => setBarPct(100), 300);
    return () => clearTimeout(t);
  }, [goal.color]);
  const STARS = [
    {
      top: "-8px",
      left: "10%",
      size: 14,
      delay: 0.1,
    },
    {
      top: "-6px",
      right: "12%",
      size: 10,
      delay: 0.2,
    },
    {
      top: "30%",
      left: "-12px",
      size: 12,
      delay: 0.3,
    },
    {
      top: "25%",
      right: "-10px",
      size: 10,
      delay: 0.15,
    },
    {
      bottom: "10%",
      left: "5%",
      size: 11,
      delay: 0.25,
    },
    {
      bottom: "8%",
      right: "8%",
      size: 13,
      delay: 0.35,
    },
  ];
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backdropFilter: "blur(6px)",
      }}
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      transition={{
        duration: 0.2,
      }}
      onClick={onClose}
    >
      {/* Dark overlay */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "rgba(12,42,69,0.65)",
        }}
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
      />

      <motion.div
        className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border overflow-hidden"
        initial={{
          opacity: 0,
          scale: 0.82,
          y: 32,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        transition={{
          type: "spring",
          stiffness: 320,
          damping: 26,
          delay: 0.05,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Coloured top bar */}
        <motion.div
          className="h-1.5 w-full"
          style={{
            background: `linear-gradient(90deg, ${goal.color}, #22c55e)`,
          }}
          initial={{
            scaleX: 0,
            originX: 0,
          }}
          animate={{
            scaleX: 1,
          }}
          transition={{
            duration: 0.6,
            delay: 0.25,
            ease: "easeOut",
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold font-['Poppins'] text-foreground">Goal Achieved! 🎉</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5">
          {/* Emoji with orbiting stars */}
          <div className="flex flex-col items-center text-center gap-3">
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Pulsing ring */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `${goal.color}18`,
                  border: `2px solid ${goal.color}40`,
                }}
                animate={{
                  scale: [1, 1.15, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Stars */}
              {STARS.map((s, i) => (
                <motion.div
                  key={i}
                  className="absolute text-yellow-400 select-none pointer-events-none"
                  style={{
                    top: s.top,
                    left: s.left,
                    right: s.right,
                    bottom: s.bottom,
                    fontSize: s.size,
                  }}
                  initial={{
                    opacity: 0,
                    scale: 0,
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.3, 0],
                    rotate: [0, 20, -10, 0],
                  }}
                  transition={{
                    duration: 1.4,
                    delay: s.delay,
                    repeat: Infinity,
                    repeatDelay: 1.6,
                  }}
                >
                  ✦
                </motion.div>
              ))}

              {/* Main emoji */}
              <motion.div
                className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-md"
                style={{
                  background: `${goal.color}20`,
                  border: `2px solid ${goal.color}40`,
                }}
                animate={{
                  y: [0, -6, 0],
                  rotate: [0, -3, 3, 0],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {goal.emoji}
              </motion.div>

              {/* Check badge */}
              <motion.div
                className="absolute bottom-1 right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-card z-20"
                style={{
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                }}
                initial={{
                  scale: 0,
                  rotate: -30,
                }}
                animate={{
                  scale: 1,
                  rotate: 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 18,
                  delay: 0.5,
                }}
              >
                <CheckCircle size={14} className="text-white" strokeWidth={2.5} />
              </motion.div>
            </div>

            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.3,
              }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest text-primary mb-1">
                Goal Completed
              </p>
              <h4 className="text-xl font-bold font-['Poppins'] text-foreground">{goal.title}</h4>
              {goal.deadline && (
                <p className="text-xs text-muted-foreground mt-0.5">Target date: {goal.deadline}</p>
              )}
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 gap-3"
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.4,
            }}
          >
            {[
              {
                label: "Target Amount",
                value: `₹${goal.target.toLocaleString()}`,
              },
              {
                label: "Amount Saved",
                value: `₹${goal.saved.toLocaleString()}`,
              },
            ].map((s) => (
              <div key={s.label} className="px-4 py-3 rounded-xl border border-border bg-input-background">
                <p className="text-[11px] text-muted-foreground mb-0.5">{s.label}</p>
                <p className="text-sm font-semibold font-['Poppins'] text-foreground">{s.value}</p>
              </div>
            ))}
          </motion.div>

          {/* Progress bar */}
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              delay: 0.5,
            }}
          >
            <div className="flex justify-between mb-1.5">
              <span className="text-xs font-medium text-foreground">Progress</span>
              <span className="text-xs font-semibold text-foreground">100%</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${goal.color}, #22c55e)`,
                }}
                initial={{
                  width: "0%",
                }}
                animate={{
                  width: `${barPct}%`,
                }}
                transition={{
                  duration: 0.9,
                  ease: "easeOut",
                  delay: 0.3,
                }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              🎯 You saved ₹{goal.saved.toLocaleString()} — goal fully reached!
            </p>
          </motion.div>

          {/* Quote */}
          {goal.quote && (
            <motion.div
              className="px-4 py-3 rounded-xl"
              style={{
                background: `${goal.color}0d`,
                borderLeft: `3px solid ${goal.color}`,
              }}
              initial={{
                opacity: 0,
                x: -10,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                delay: 0.6,
              }}
            >
              <p className="text-xs italic text-muted-foreground">&quot;{goal.quote}&quot;</p>
            </motion.div>
          )}

          {/* CTA */}
          <motion.button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #2E93C7, #0D6D91)",
            }}
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.7,
            }}
            whileHover={{
              scale: 1.02,
            }}
            whileTap={{
              scale: 0.97,
            }}
          >
            Awesome, thanks! 🚀
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
