import { motion } from 'framer-motion';
import { useLocation, useNavigationType } from 'react-router-dom';

const MotionDiv = motion.div;

const ease = [0.25, 0.1, 0.25, 1];
const duration = 0.42;

/**
 * Smooth route transitions: fade + gentle vertical motion.
 * Respects navigation direction for subtle horizontal nudge (forward vs back).
 */
const getVariants = (direction, navigationType) => {
  const isReplace = navigationType === 'REPLACE';
  if (isReplace) {
    return {
      initial: { opacity: 0, scale: 0.992 },
      in: { opacity: 1, scale: 1 },
      out: { opacity: 0, scale: 0.992 },
    };
  }

  const isBack = direction === 'back' || (direction == null && navigationType === 'POP');
  const enterY = isBack ? -14 : 18;
  const exitY = isBack ? 12 : -14;

  return {
    initial: { opacity: 0, y: enterY },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: exitY },
  };
};

const pageTransition = {
  type: 'tween',
  ease,
  duration,
};

const PageTransition = ({ children }) => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const direction = location.state?.direction;
  const variants = getVariants(direction, navigationType);

  return (
    <MotionDiv
      initial="initial"
      animate="in"
      exit="out"
      variants={variants}
      transition={pageTransition}
      className="w-full min-h-screen bg-neutral-900"
      style={{
        width: '100%',
        minHeight: '100vh',
      }}
    >
      {children}
    </MotionDiv>
  );
};

export default PageTransition;
