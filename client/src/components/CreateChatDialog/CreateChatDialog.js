import React, { useState } from 'react';
import './CreateChatDialog.css';

function CreateChatDialog({ chat, onClose, onSave }) {
  const [firstName, setFirstName] = useState(chat ? chat.firstName : '');
  const [lastName, setLastName] = useState(chat ? chat.lastName : '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ firstName, lastName });
  };

  return (
    <div className='modal-overlay'>
      <div className='create-chat-dialog'>
        <h3>{chat ? 'Edit Chat' : 'Create New Chat'}</h3>
        <form onSubmit={handleSubmit}>
          <div className='form-group'>
            <label>First Name</label>
            <input
              type='text'
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder='Enter first name'
              required
            />
          </div>
          <div className='form-group'>
            <label>Last Name</label>
            <input
              type='text'
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder='Enter last name'
              required
            />
          </div>
          <div className='dialog-actions'>
            <button type='button' className='cancel-btn' onClick={onClose}>
              Cancel
            </button>
            <button type='submit' className='save-btn'>
              {chat ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateChatDialog;
