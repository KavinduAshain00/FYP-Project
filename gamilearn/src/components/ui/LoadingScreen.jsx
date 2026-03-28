import { motion } from "framer-motion";

const ease = [0.25, 0.1, 0.25, 1];

/**
 * Full-page or inline loading state with smooth entrance animation.
 */
const LoadingScreen = ({
  message = "Loading…",
  subMessage = null,
  inline = false,
  className = "",
}) => {
  const content = (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
    >
      <motion.div
        className="h-10 w-10 shrink-0 rounded-full border-2 border-blue-400 border-t-transparent"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.85, repeat: Infinity, ease: "linear" }}
        aria-hidden
      />
      <motion.p
        className="text-sm font-medium text-blue-50 mt-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.12, duration: 0.35, ease }}
      >
        {message}
      </motion.p>
      {subMessage && (
        <motion.p
          className="text-xs text-blue-300 mt-1 max-w-xs text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.35, ease }}
        >
          {subMessage}
        </motion.p>
      )}
    </motion.div>
  );

  if (inline) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-0 py-8 ${className}`}
        role="status"
        aria-live="polite"
        aria-label={message}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className={`min-h-[50vh] flex flex-col items-center justify-center gap-0 text-center px-4 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      {content}
    </div>
  );
};

export default LoadingScreen;
