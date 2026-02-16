import { motion } from "framer-motion";

const pageTransition = {
  type: "tween",
  ease: [0.32, 0.72, 0, 1],
  duration: 0.25,
};

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={pageTransition}
    style={{
      width: "100%",
      minHeight: "100vh",
      backgroundColor: "#000000",
    }}
  >
    {children}
  </motion.div>
);

export default PageTransition;
