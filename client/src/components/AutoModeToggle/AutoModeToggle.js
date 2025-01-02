import React from 'react';
import { useSocket } from '../../context/SocketContext';
import './AutoModeToggle.css';
import { toast } from 'react-hot-toast';
import { MdAutorenew } from 'react-icons/md';

function AutoModeToggle() {
  const { socket, isAutoMode, setIsAutoMode } = useSocket();
  const userId = localStorage.getItem('userId');

  const toggleAutoMode = () => {
    if (!socket || !userId) {
      toast.error('Authentication required');
      return;
    }

    if (!isAutoMode) {
      socket.emit('join', userId);
      socket.emit('startAutoMode', userId);
      setIsAutoMode(true);
      toast.success('Auto mode started');
    } else {
      socket.emit('stopAutoMode');
      setIsAutoMode(false);
      toast.success('Auto mode stopped');
    }
  };

  return (
    <div className='auto-mode-toggle'>
      <button
        className={`toggle-btn ${isAutoMode ? 'active' : ''}`}
        onClick={toggleAutoMode}
        disabled={!socket || !userId}
      >
        <MdAutorenew size={20} />
        Auto Mode
      </button>
    </div>
  );
}

export default AutoModeToggle;
