import React from "react";

const ConfirmModal = ({
  open,
  title = "Confirm",
  message = "",
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="w-[90%] max-w-[420px] rounded-xl border border-gray-700 bg-gray-900 p-5 text-gray-100">
        <h3 className="mb-2.5 text-lg font-semibold">{title}</h3>
        <p className="mb-4 text-gray-300">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            className="rounded-lg border border-gray-600 bg-gray-800 px-3.5 py-2 text-gray-200 hover:bg-gray-700"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="rounded-lg border border-cyan-600 bg-cyan-600 px-3.5 py-2 text-white hover:bg-cyan-500"
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
