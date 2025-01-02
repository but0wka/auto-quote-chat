import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import './LoginDialog.css';
import { toast } from 'react-hot-toast';

function LoginDialog({ onClose }) {
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      console.log('Full credential response:', credentialResponse);
      console.log(
        'Client ID check:',
        credentialResponse.clientId === process.env.REACT_APP_GOOGLE_CLIENT_ID
      );

      if (!credentialResponse.credential) {
        console.error('No credential received');
        return;
      }

      const response = await fetch(
        `${process.env.REACT_APP_SERVER_URL}/api/auth/google`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            credential: credentialResponse.credential,
          }),
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log('Login successful:', data);
        localStorage.setItem('token', data.token);
        window.location.reload();
      } else {
        console.error('Server error:', data);
        toast.error(data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Login failed');
    }
  };

  return (
    <div className='modal-overlay'>
      <div className='login-dialog'>
        <h3>Login to Messenger</h3>
        <p>Choose your login method:</p>
        <div className='login-options'>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={(error) => {
              console.error('Login Failed:', error);
            }}
            useOneTap={false}
            flow='implicit'
            auto_select={false}
            type='standard'
            theme='filled_blue'
            size='large'
            context='signin'
            ux_mode='popup'
          />
        </div>
        <button className='cancel-btn' onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default LoginDialog;
