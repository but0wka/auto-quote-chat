import React, { useState } from 'react';
import './SearchBar.css';
import { MdSearch, MdAdd } from 'react-icons/md';
import CreateChatDialog from '../CreateChatDialog/CreateChatDialog';
import { toast } from 'react-hot-toast';
import AutoModeToggle from '../AutoModeToggle/AutoModeToggle';

function SearchBar({ onSearch, onCreateChat, isAuthenticated }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleCreateClick = () => {
    if (!isAuthenticated) {
      toast.error('Please login to create chats');
      return;
    }
    setShowCreateDialog(true);
  };

  return (
    <div className='search-section'>
      <div className='search-bar'>
        <div className='search-input-wrapper'>
          <MdSearch className='search-icon' />
          <input
            type='text'
            placeholder={
              isAuthenticated ? 'Search chats...' : 'Please login to search'
            }
            onChange={(e) => onSearch(e.target.value)}
            disabled={!isAuthenticated}
          />
        </div>
      </div>
      <div className='buttons-row'>
        <button
          className='new-chat-btn'
          onClick={handleCreateClick}
          disabled={!isAuthenticated}
        >
          <MdAdd size={20} />
          New Chat
        </button>
        {isAuthenticated && <AutoModeToggle />}
      </div>
      {showCreateDialog && (
        <CreateChatDialog
          onClose={() => setShowCreateDialog(false)}
          onSave={async (chatData) => {
            const success = await onCreateChat(chatData);
            if (success) {
              setShowCreateDialog(false);
            }
          }}
        />
      )}
    </div>
  );
}

export default SearchBar;
