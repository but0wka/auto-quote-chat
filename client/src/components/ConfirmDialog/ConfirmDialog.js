import React from 'react';
import './ConfirmDialog.css';

function ConfirmDialog({ message, onConfirm, onClose }) {
  return (
    <div className='modal-overlay'>
      <div className='confirm-dialog'>
        <h3>Confirm Action</h3>
        <p>{message}</p>
        <div className='confirm-actions'>
          <button className='cancel-btn' onClick={onClose}>
            Cancel
          </button>
          <button className='confirm-btn' onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
