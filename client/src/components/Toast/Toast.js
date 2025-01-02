import React from 'react';
import './Toast.css';

function Toast({ message }) {
  return <div className='toast'>{message}</div>;
}

export default Toast;
