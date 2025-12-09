import React from 'react';
import './ConfirmModal.css';

const ConfirmModal = ({ open, title = 'Confirm', message = '', onConfirm, onCancel }) => {
  if (!open) return null;

  return (
    <div className="confirm-overlay">
      <div className="confirm-modal">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="btn-confirm" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
