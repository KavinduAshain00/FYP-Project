import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  FaArrowRight,
  FaBolt,
  FaCheck,
  FaFire,
  FaSpinner,
  FaStar,
  FaTrophy,
  FaUserCircle,
} from "react-icons/fa";
import {
  peelTotalPointsToProgress,
  xpToAdvanceFromLevel,
} from "../../utils/levelCurve";

const ease = [0.25, 0.1, 0.25, 1];

/** Wait after modal opens before the +XP counter starts ticking. */
const XP_COUNTER_START_DELAY_MS = 550;

/** Extra pause after the counter begins before the level bar starts (stagger). */
const XP_BAR_STAGGER_AFTER_COUNTER_MS = 280;

/** ms of bar animation per 1 XP gained in a segment (higher = slower bar). */
const XP_BAR_MS_PER_XP_FIRST_CLEAR = 10.5;
const XP_BAR_MS_PER_XP_REPEAT = 6;

/** Clamp each bar segment duration (ms). */
const XP_BAR_SEGMENT_MIN_MS = 520;
const XP_BAR_SEGMENT_MAX_MS = 2600;

const XP_PAUSE_ON_LEVEL_UP_MS = 320;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function animateBarSegment(fromPct, toPct, durationMs, onUpdate, cancelled) {
  if (fromPct === toPct) return;
  const t0 = performance.now();
  return new Promise((resolve) => {
    function frame(now) {
      if (cancelled()) return resolve();
      const raw = Math.min(1, (now - t0) / durationMs);
      // Ease-out cubic: smooth deceleration into each segment end (reads clearer than linear/quad).
      const eased = 1 - (1 - raw) ** 3;
      const v = fromPct + (toPct - fromPct) * eased;
      onUpdate(v);
      if (raw < 1) requestAnimationFrame(frame);
      else {
        onUpdate(toPct);
        resolve();
      }
    }
    requestAnimationFrame(frame);
  });
}

/**
 * Animate XP bar fill and level number stepping (matches server peelTotalPointsToProgress curve).
 */
async function runXpBarAnimation({
  totalPointsStart,
  totalPointsEnd,
  setBarFill,
  setDisplayLevel,
  cancelled,
  msPerXp = XP_BAR_MS_PER_XP_FIRST_CLEAR,
  pauseOnLevelUpMs = XP_PAUSE_ON_LEVEL_UP_MS,
}) {
  let cursor = Math.max(0, Number(totalPointsStart) || 0);
  const target = Math.max(0, Number(totalPointsEnd) || 0);

  const init = peelTotalPointsToProgress(cursor);
  setDisplayLevel(init.level);
  setBarFill(init.currentXP);

  if (target <= cursor) {
    const end = peelTotalPointsToProgress(target);
    setDisplayLevel(end.level);
    setBarFill(end.currentXP);
    return;
  }

  while (cursor < target) {
    if (cancelled()) return;
    const p = peelTotalPointsToProgress(cursor);
    const room = p.xpToNext;
    const gain = Math.min(room, target - cursor);
    const fromFill = p.currentXP;
    const toFill = p.currentXP + gain;
    const duration = Math.min(
      XP_BAR_SEGMENT_MAX_MS,
      Math.max(XP_BAR_SEGMENT_MIN_MS, gain * msPerXp),
    );

    await animateBarSegment(
      fromFill,
      toFill,
      duration,
      (v) => {
        if (!cancelled())
          setBarFill(Math.min(p.xpNeeded, Math.max(0, v)));
      },
      cancelled,
    );

    cursor += gain;
    if (cancelled()) return;

    const leveledUp = gain === room && room > 0 && cursor < target;
    if (leveledUp) {
      const next = peelTotalPointsToProgress(cursor);
      setDisplayLevel(next.level);
      setBarFill(0);
      await sleep(pauseOnLevelUpMs);
    }
  }

  if (!cancelled()) {
    const end = peelTotalPointsToProgress(target);
    setDisplayLevel(end.level);
    setBarFill(end.currentXP);
  }
}

const ModuleCompleteResultsModal = ({
  open,
  onContinue,
  moduleTitle = "",
  firstTimeComplete = true,
  /** Total lifetime XP gained this completion (module + achievements). */
  xpGainedTotal = 0,
  totalPointsStart = 0,
  totalPointsEnd = 0,
  sessionStats = {},
  newlyEarnedCount = 0,
  /** Achievement objects from completeModule: { id, name, description, icon, points, category } */
  newlyEarned = [],
  avatarUrl = "",
  /** Same picsum URL as module catalog card for this module. */
  moduleCoverImageUrl = "",
}) => {
  const [displayXpGain, setDisplayXpGain] = useState(0);
  const [barFill, setBarFill] = useState(0);
  const [displayLevel, setDisplayLevel] = useState(1);
  const [animationsDone, setAnimationsDone] = useState(false);
  const cancelRef = useRef(false);
  const reduceMotion = useReducedMotion();

  const barMotionTransition = reduceMotion
    ? { duration: 0 }
    : {
        type: "spring",
        stiffness: 440,
        damping: 36,
        mass: 0.72,
        restDelta: 0.2,
        restSpeed: 0.2,
      };

  useEffect(() => {
    if (!open) return undefined;
    cancelRef.current = false;

    const cancelled = () => cancelRef.current;

    const run = async () => {
      const gain = Math.max(0, Number(xpGainedTotal) || 0);

      await sleep(XP_COUNTER_START_DELAY_MS);
      if (cancelled()) return;

      const xpDuration =
        gain <= 0 ? 220 : Math.min(1400, Math.max(480, 380 + gain * 2.8));
      const t0 = performance.now();

      const xpTick = () => {
        if (cancelled()) return;
        const raw = Math.min(1, (performance.now() - t0) / xpDuration);
        const eased = 1 - (1 - raw) * (1 - raw);
        setDisplayXpGain(Math.round(gain * eased));
        if (raw < 1) requestAnimationFrame(xpTick);
      };
      requestAnimationFrame(xpTick);

      await sleep(XP_BAR_STAGGER_AFTER_COUNTER_MS);
      if (cancelled()) return;

      await runXpBarAnimation({
        totalPointsStart,
        totalPointsEnd,
        setBarFill,
        setDisplayLevel,
        cancelled,
        msPerXp:
          firstTimeComplete && gain > 0
            ? XP_BAR_MS_PER_XP_FIRST_CLEAR
            : XP_BAR_MS_PER_XP_REPEAT,
        pauseOnLevelUpMs: XP_PAUSE_ON_LEVEL_UP_MS,
      });

      if (!cancelled()) setAnimationsDone(true);
    };

    const t = setTimeout(() => {
      setAnimationsDone(false);
      setDisplayXpGain(0);
      const startPeel = peelTotalPointsToProgress(totalPointsStart);
      setBarFill(startPeel.currentXP);
      setDisplayLevel(startPeel.level);
      void run();
    }, 0);

    return () => {
      cancelRef.current = true;
      clearTimeout(t);
    };
  }, [open, xpGainedTotal, totalPointsStart, totalPointsEnd, firstTimeComplete]);

  const edits = Number(sessionStats.totalEdits) || 0;
  const streak = Number(sessionStats.streak) || 0;
  const barXpCap = Math.max(1, xpToAdvanceFromLevel(displayLevel));
  const barPct = Math.min(100, Math.max(0, (barFill / barXpCap) * 100));

  const unlockList = Array.isArray(newlyEarned) ? newlyEarned : [];
  const hasUnlocks =
    unlockList.length > 0 || (Number(newlyEarnedCount) || 0) > 0;
  const avatarSrc = String(avatarUrl || "").trim();
  const coverSrc = String(moduleCoverImageUrl || "").trim();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="presentation"
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease }}
        >
          <motion.div
            role="presentation"
            aria-hidden
            className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="module-complete-title"
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-2xl text-blue-50"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 12 }}
            transition={{ duration: 0.32, ease }}
          >
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-blue-950/95 shadow-[0_24px_80px_-12px_rgb(0_0_0/0.75)] backdrop-blur-xl">
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/[0.07] via-transparent to-amber-500/[0.05]"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-0 bg-hero-grid opacity-[0.2]"
                aria-hidden
              />

              <div className="relative flex min-h-0 flex-col md:min-h-[min(440px,72vh)] md:flex-row md:items-stretch">
                {/* Left rail — module art + identity */}
                <aside className="relative flex min-h-[200px] flex-col items-center justify-center gap-4 overflow-hidden border-b border-white/10 px-6 py-8 md:min-h-0 md:w-[min(240px,34%)] md:shrink-0 md:border-b-0 md:border-r md:py-10">
                  {coverSrc ? (
                    <>
                      <img
                        src={coverSrc}
                        alt=""
                        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
                      />
                      <div
                        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-950/35 via-blue-950/82 to-blue-950/95"
                        aria-hidden
                      />
                      <div
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-blue-950 via-transparent to-blue-950/50 md:bg-gradient-to-r md:from-transparent md:via-blue-950/20 md:to-blue-950/90"
                        aria-hidden
                      />
                    </>
                  ) : (
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-900/40 to-blue-950/80 md:to-transparent"
                      aria-hidden
                    />
                  )}
                  <motion.div
                    className="relative z-[1]"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 280, damping: 24 }}
                  >
                    <div className="relative mx-auto w-fit">
                      <div
                        className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-blue-400/60 to-blue-600/40 opacity-80 blur-[2px]"
                        aria-hidden
                      />
                      <div className="relative h-[5.5rem] w-[5.5rem] overflow-hidden rounded-full border-2 border-white/20 bg-blue-950 shadow-lg ring-4 ring-blue-950/80 sm:h-[6rem] sm:w-[6rem]">
                        {avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt=""
                            className="h-full w-full object-cover object-center"
                          />
                        ) : (
                          <FaUserCircle
                            className="h-full w-full text-blue-400/75"
                            aria-hidden
                          />
                        )}
                      </div>
                      <span
                        className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-950 bg-neon-green text-blue-950 shadow-md"
                        aria-hidden
                      >
                        <FaCheck className="text-xs font-black" />
                      </span>
                    </div>
                  </motion.div>
                  <div className="relative z-[1] text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-300/80">
                      You
                    </p>
                    <motion.p
                      className="mt-1 text-4xl font-black tabular-nums text-amber-300"
                      key={displayLevel}
                      initial={{ opacity: 0.4, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 26 }}
                    >
                      {displayLevel}
                    </motion.p>
                    <p className="text-[11px] font-medium text-blue-400/90">
                      Current level
                    </p>
                  </div>
                </aside>

                {/* Main column */}
                <div className="relative flex min-w-0 flex-1 flex-col px-5 pb-5 pt-6 sm:px-7 sm:pb-6 sm:pt-7">
                  <header className="min-w-0 border-b border-white/10 pb-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-400/90">
                      Module complete
                    </p>
                    <h2
                      id="module-complete-title"
                      className="mt-1.5 text-balance text-xl font-extrabold leading-snug text-white sm:text-2xl"
                    >
                      {moduleTitle || "Lesson finished"}
                    </h2>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-blue-200">
                        <FaBolt className="text-amber-300" aria-hidden />
                        <span className="tabular-nums">{edits}</span>
                        <span className="font-normal text-blue-400/90">edits</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-blue-200">
                        <FaFire className="text-orange-400" aria-hidden />
                        <span className="tabular-nums">{streak}</span>
                        <span className="font-normal text-blue-400/90">streak</span>
                      </span>
                    </div>
                  </header>

                  <div className="mt-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                        XP gained
                      </p>
                      <div className="mt-0.5 flex items-baseline gap-2">
                        <motion.span
                          className="text-[2.75rem] font-black leading-none tabular-nums tracking-tight text-blue-300 sm:text-5xl"
                          key={displayXpGain}
                          initial={{ scale: 1.06 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.1 }}
                        >
                          +{displayXpGain}
                        </motion.span>
                        <span className="pb-1 text-sm font-semibold text-blue-400">
                          XP
                        </span>
                      </div>
                      {!firstTimeComplete && (
                        <p className="mt-2 max-w-sm text-xs leading-relaxed text-blue-400/90">
                          Replay — module XP was not applied again.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-blue-400">
                      <span className="font-medium text-blue-300/90">
                        Progress to next level
                      </span>
                      <span className="tabular-nums text-blue-200/85">
                        {Math.round(barFill)} / {barXpCap}
                      </span>
                    </div>
                    <div className="relative h-3 overflow-hidden rounded-full bg-blue-950/90 ring-1 ring-white/10 shadow-[inset_0_1px_3px_rgb(0_0_0/0.45)]">
                      <div
                        className="pointer-events-none absolute inset-0 rounded-full bg-black/15"
                        aria-hidden
                      />
                      <motion.div
                        className="absolute bottom-0 left-0 top-0 z-[1] overflow-hidden rounded-full bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 shadow-[0_0_14px_rgb(var(--color-blue-400-rgb)/0.35)]"
                        initial={false}
                        animate={{ width: `${barPct}%` }}
                        transition={{ width: barMotionTransition }}
                      >
                        {!animationsDone && !reduceMotion ? (
                          <span
                            className="pointer-events-none absolute inset-y-0 -left-1/2 w-[70%] bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-70 animate-shimmer"
                            aria-hidden
                          />
                        ) : null}
                      </motion.div>
                    </div>
                  </div>

                  {hasUnlocks && unlockList.length > 0 ? (
                    <motion.div
                      className="mt-6 min-w-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <FaTrophy className="text-amber-400" aria-hidden />
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-200/90">
                            Unlocked
                          </span>
                        </div>
                        <FaStar className="text-amber-400/35" aria-hidden />
                      </div>
                      <ul
                        className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 pt-0.5 [scrollbar-width:thin]"
                        aria-label="Newly unlocked achievements"
                      >
                        {unlockList.map((ach, i) => (
                          <motion.li
                            key={ach?.id ?? `${ach?.name}-${i}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: 0.06 + i * 0.05,
                              duration: 0.28,
                              ease,
                            }}
                            className="flex w-[min(100%,240px)] shrink-0 snap-start flex-col rounded-2xl border border-amber-400/25 bg-gradient-to-b from-amber-500/10 to-blue-950/60 p-3 shadow-inner"
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
                                {ach?.icon ? (
                                  <img
                                    src={ach.icon}
                                    alt=""
                                    className="h-6 w-6 object-contain brightness-0 invert opacity-90"
                                  />
                                ) : (
                                  <FaTrophy
                                    className="text-base text-amber-200/90"
                                    aria-hidden
                                  />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 text-sm font-bold leading-tight text-amber-50">
                                  {ach?.name || "Achievement"}
                                </p>
                                {ach?.points != null && Number(ach.points) > 0 ? (
                                  <p className="mt-1 text-[11px] font-bold tabular-nums text-blue-300/90">
                                    +{ach.points} XP
                                  </p>
                                ) : null}
                              </div>
                            </div>
                            {ach?.description ? (
                              <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-blue-300/75">
                                {ach.description}
                              </p>
                            ) : null}
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  ) : hasUnlocks ? (
                    <div className="mt-6 flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/[0.08] px-4 py-3">
                      <FaTrophy className="text-lg text-amber-300" aria-hidden />
                      <p className="text-sm font-semibold text-amber-100/95">
                        {Number(newlyEarnedCount) || 0} new achievement
                        {(Number(newlyEarnedCount) || 0) === 1 ? "" : "s"}
                      </p>
                    </div>
                  ) : null}

                  <div className="min-h-3 flex-1" aria-hidden />

                  <motion.button
                    type="button"
                    disabled={!animationsDone}
                    whileHover={animationsDone ? { scale: 1.01 } : {}}
                    whileTap={animationsDone ? { scale: 0.99 } : {}}
                    onClick={onContinue}
                    className={`mt-6 flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold transition-colors md:mt-0 md:py-4 ${
                      animationsDone
                        ? "bg-blue-400 text-blue-950 shadow-[0_0_24px_rgb(var(--color-blue-400-rgb)/0.35)] hover:bg-blue-300"
                        : "cursor-not-allowed border border-white/10 bg-white/[0.04] text-blue-500"
                    }`}
                  >
                    Continue to dashboard
                    <FaArrowRight className="text-xs opacity-90" aria-hidden />
                  </motion.button>

                  {!animationsDone && (
                    <p className="mt-2 flex items-center justify-center gap-2 text-center text-[11px] font-medium text-blue-400">
                      <FaSpinner className="animate-spin text-blue-400/90" aria-hidden />
                      Tallying rewards…
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ModuleCompleteResultsModal;
