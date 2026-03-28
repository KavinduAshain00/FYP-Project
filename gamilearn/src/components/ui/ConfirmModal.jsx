import { AnimatePresence, motion } from "framer-motion";

const ease = [0.25, 0.1, 0.25, 1];

const ConfirmModal = ({
  open,
  title = "Confirm",
  message = "",
  onConfirm,
  onCancel,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="presentation"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease }}
        >
          <motion.div
            role="presentation"
            aria-hidden
            className="fixed inset-0 bg-neutral-900/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-[90%] max-w-[420px] rounded-2xl bg-blue-900 p-6 text-blue-50 shadow-2xl shadow-black/50"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.28, ease }}
          >
            <h3
              id="confirm-modal-title"
              className="mb-2 text-lg font-bold text-blue-50"
            >
              {title}
            </h3>
            <p className="mb-6 text-sm text-blue-200 leading-relaxed">
              {message}
            </p>
            <div className="flex justify-end gap-3">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-black hover:bg-blue-600 transition-colors"
                onClick={onCancel}
              >
                Cancel
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-xl bg-blue-400 px-4 py-2.5 text-sm font-semibold text-black hover:bg-blue-300 transition-colors"
                onClick={onConfirm}
              >
                Confirm
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
