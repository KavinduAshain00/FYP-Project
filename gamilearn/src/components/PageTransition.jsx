import { motion } from "framer-motion";
import { useLocation, useNavigationType } from "react-router-dom";

const MotionDiv = motion.div;

const SWIPE_DURATION = 0.35;
const SWIPE_EASE = [0.32, 0.72, 0, 1];

/**
 * Swipe-style page transition:
 * - Forward: new page slides in from right, old slides out to left
 * - Back: new page slides in from left, old slides out to right
 * - Direction comes from location.state.direction (set by nav) or navigationType (POP = back, PUSH = forward)
 * - REPLACE: crossfade
 */
const getSwipeVariants = (direction, navigationType) => {
  const isReplace = navigationType === "REPLACE";
  if (isReplace) {
    return {
      initial: { opacity: 0 },
      in: { opacity: 1 },
      out: { opacity: 0 },
    };
  }

  const isBack = direction === "back" || (direction == null && navigationType === "POP");
  const enterX = isBack ? "-100%" : "100%";
  const exitX = isBack ? "100%" : "-100%";

  return {
    initial: {
      opacity: 0,
      x: enterX,
    },
    in: {
      opacity: 1,
      x: 0,
    },
    out: {
      opacity: 0.6,
      x: exitX,
    },
  };
};

const pageTransition = {
  type: "tween",
  ease: SWIPE_EASE,
  duration: SWIPE_DURATION,
};

const PageTransition = ({ children }) => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const direction = location.state?.direction;
  const variants = getSwipeVariants(direction, navigationType);

  return (
    <MotionDiv
      initial="initial"
      animate="in"
      exit="out"
      variants={variants}
      transition={pageTransition}
      style={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "#000000",
      }}
    >
      {children}
    </MotionDiv>
  );
};

export default PageTransition;
