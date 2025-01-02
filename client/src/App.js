import React, { useState, useEffect } from 'react';
import ChatList from './components/ChatList/ChatList';
import Chat from './components/Chat/Chat';
import SearchBar from './components/SearchBar/SearchBar';
import CreateChatDialog from './components/CreateChatDialog/CreateChatDialog';
import { Toaster, toast } from 'react-hot-toast';
import { getAvatarUrl } from './config/avatar';
import './styles/App.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LoginDialog from './components/LoginDialog/LoginDialog';
import { GoogleLogin } from '@react-oauth/google';
import { SocketProvider } from './context/SocketContext';

function App() {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingChat, setEditingChat] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile();
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_SERVER_URL}/api/auth/profile`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setIsAuthenticated(false);
    setUser(null);
    window.location.reload();
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchChats();
    } else {
      setChats([]);
    }
  }, [isAuthenticated]);

  const fetchChats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(
        `${process.env.REACT_APP_SERVER_URL}/api/chats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setChats(data);

      if (selectedChat && !data.find((chat) => chat._id === selectedChat._id)) {
        setSelectedChat(null);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast.error('Error loading chats');
    }
  };

  const showNotification = (message, type = 'success') => {
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  const handleChatUpdate = (chat) => {
    setEditingChat(chat);
    setIsEditDialogOpen(true);
  };

  const handleChatDelete = async () => {
    if (!isAuthenticated || !selectedChat) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_SERVER_URL}/api/chats/${selectedChat._id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.ok) {
        setSelectedChat(null);
        setChats((prevChats) =>
          prevChats.filter((chat) => chat._id !== selectedChat._id)
        );
        toast.success('Chat deleted successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error deleting chat');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Error deleting chat');
    }
  };

  const handleCreateChat = async (newChat) => {
    if (!isAuthenticated) {
      toast.error('Please login to create chats');
      return false;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_SERVER_URL}/api/chats`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(newChat),
        }
      );

      if (response.ok) {
        const createdChat = await response.json();
        setChats((prevChats) => [...prevChats, createdChat]);
        toast.success('Chat created successfully');
        return true;
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error creating chat');
        return false;
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Error creating chat');
      return false;
    }
  };

  const handleEditChat = async (chatId, updatedData) => {
    if (!isAuthenticated) {
      toast.error('Please login to edit chats');
      return false;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_SERVER_URL}/api/chats/${chatId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(updatedData),
        }
      );

      if (response.ok) {
        const updatedChat = await response.json();
        setChats((prevChats) =>
          prevChats.map((chat) => (chat._id === chatId ? updatedChat : chat))
        );

        if (selectedChat && selectedChat._id === chatId) {
          setSelectedChat(updatedChat);
        }

        toast.success('Chat updated successfully');
        return true;
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error updating chat');
        console.error('Error updating chat:', error);
        toast.error('Error updating chat');
        return false;
      }
    } catch (error) {
      console.error('Error updating chat:', error);
      toast.error('Error updating chat');
      return false;
    }
  };

  const handleMessageSent = async (message, chatId) => {
    if (!isAuthenticated) {
      toast.error('Please login to send messages');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_SERVER_URL}/api/messages/${chatId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(message),
        }
      );

      if (response.ok) {
        const updatedChat = await response.json();
        await fetchChats();
        if (selectedChat && selectedChat._id === chatId) {
          setSelectedChat(updatedChat);
        }
        showNotification('Message sent');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error sending message');
    }
  };

  const handleBotResponse = (chat, message) => {
    fetchChats();

    toast(
      (t) => (
        <div
          className='chat-notification'
          onClick={() => {
            setSelectedChat(chat);
            toast.dismiss(t.id);
          }}
        >
          <div className='notification-avatar'>
            <img
              src={getAvatarUrl(chat.firstName, chat.lastName)}
              alt='avatar'
            />
          </div>
          <div className='notification-content'>
            <div className='notification-name'>
              {chat.firstName} {chat.lastName}
            </div>
            <div className='notification-message'>{message}</div>
          </div>
        </div>
      ),
      {
        duration: 4000,
        style: {
          padding: '0',
          background: 'white',
          cursor: 'pointer',
        },
      }
    );
  };

  const filteredChats = chats.filter((chat) => {
    const fullName = `${chat.firstName} ${chat.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  const getProfileImage = (user) => {
    if (user.picture && user.picture !== 'undefined') {
      return user.picture;
    }
    return getAvatarUrl(user.name.split(' ')[0], user.name.split(' ')[1] || '');
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
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
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.user._id);
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        toast.error(data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Login failed');
    }
  };

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <SocketProvider>
        <div className='app'>
          <div className='sidebar'>
            <div className='sidebar-header'>
              <div className='user-profile'>
                {isAuthenticated ? (
                  <>
                    <div className='avatar'>
                      <img
                        src={getProfileImage(user)}
                        alt='avatar'
                        onError={(e) => {
                          e.target.src = getAvatarUrl(
                            user.name.split(' ')[0],
                            user.name.split(' ')[1] || ''
                          );
                        }}
                      />
                    </div>
                    <span>{user.name}</span>
                  </>
                ) : (
                  <div className='avatar'>
                    <span>?</span>
                  </div>
                )}
              </div>
              {isAuthenticated && (
                <button className='logout-btn' onClick={handleLogout}>
                  Logout
                </button>
              )}
            </div>
            <SearchBar
              onSearch={setSearchQuery}
              onCreateChat={handleCreateChat}
              isAuthenticated={isAuthenticated}
            />
            <div className='chats-section'>
              <div className='chats-header'>
                <h2>Chats</h2>
              </div>
            </div>
            {isAuthenticated ? (
              <ChatList
                chats={filteredChats}
                onChatSelect={setSelectedChat}
                onCreateChat={handleCreateChat}
                selectedChat={selectedChat}
                onChatsUpdate={setChats}
              />
            ) : (
              <div className='chat-list'>
                <div className='empty-state'>
                  <p>No chats available</p>
                </div>
                <div className='github-badge'>
                  <a
                    href='https://github.com/but0wka/auto-quote-chat'
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <div className='github-card'>
                      <div className='github-card-header'>
                        <img
                          src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTIgMGMtNi42MjYgMC0xMiA1LjM3My0xMiAxMiAwIDUuMzAyIDMuNDM4IDkuOCA4LjIwNyAxMS4zODcuNTk5LjExMS43OTMtLjI2MS43OTMtLjU3N3YtMi4yMzRjLTMuMzM4LjcyNi00LjAzMy0xLjQxNi00LjAzMy0xLjQxNi0uNTQ2LTEuMzg3LTEuMzMzLTEuNzU2LTEuMzMzLTEuNzU2LTEuMDg5LS43NDUuMDgzLS43MjkuMDgzLS43MjkgMS4yMDUuMDg0IDEuODM5IDEuMjM3IDEuODM5IDEuMjM3IDEuMDcgMS44MzQgMi44MDcgMS4zMDQgMy40OTIuOTk3LjEwNy0uNzc1LjQxOC0xLjMwNS43NjItMS42MDQtMi42NjUtLjMwNS01LjQ2Ny0xLjMzNC01LjQ2Ny01LjkzMSAwLTEuMzExLjQ2OS0yLjM4MSAxLjIzNi0zLjIyMS0uMTI0LS4zMDMtLjUzNS0xLjUyNC4xMTctMy4xNzYgMCAwIDEuMDA4LS4zMjIgMy4zMDEgMS4yMy45NTctLjI2NiAxLjk4My0uMzk5IDMuMDAzLS40MDQgMS4wMi4wMDUgMi4wNDcuMTM4IDMuMDA2LjQwNCAyLjI5MS0xLjU1MiAzLjI5Ny0xLjIzIDMuMjk3LTEuMjMuNjUzIDEuNjUzLjI0MiAyLjg3NC4xMTggMy4xNzYuNzcuODQgMS4yMzUgMS45MTEgMS4yMzUgMy4yMjEgMCA0LjYwOS0yLjgwNyA1LjYyNC01LjQ3OSA1LjkyMS40My4zNzIuODIzIDEuMTAyLjgyMyAyLjIyMnYzLjI5M2MwIC4zMTkuMTkyLjY5NC44MDEuNTc2IDQuNzY1LTEuNTg5IDguMTk5LTYuMDg2IDguMTk5LTExLjM4NiAwLTYuNjI3LTUuMzczLTEyLTEyLTEyeiIvPjwvc3ZnPg=='
                          alt='GitHub'
                          className='github-logo'
                        />
                        <span className='github-repo-name'>
                          but0wka/auto-quote-chat
                        </span>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            )}
          </div>
          <div className='main-content'>
            {isAuthenticated ? (
              selectedChat ? (
                <Chat
                  chat={selectedChat}
                  onMessageSent={handleMessageSent}
                  onBotResponse={handleBotResponse}
                  onChatUpdate={handleChatUpdate}
                  onChatDelete={handleChatDelete}
                  onChatsUpdate={setChats}
                />
              ) : (
                <div className='no-chat-selected'>
                  <h2>Select a chat to start messaging</h2>
                </div>
              )
            ) : (
              <div className='login-prompt'>
                <h2>Welcome to Messenger</h2>
                <p>Please login to start chatting</p>
                <div className='google-login-container'>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={(error) => {
                      console.error('Login Failed:', error);
                      toast.error('Login failed');
                    }}
                    useOneTap={false}
                    theme='outline'
                    size='large'
                    text='signin_with'
                    shape='rectangular'
                  />
                </div>
              </div>
            )}
          </div>
          {isEditDialogOpen && (
            <CreateChatDialog
              chat={editingChat}
              onClose={() => {
                setIsEditDialogOpen(false);
                setEditingChat(null);
              }}
              onSave={async (chatData) => {
                const success = await handleEditChat(editingChat._id, chatData);
                if (success) {
                  setIsEditDialogOpen(false);
                  setEditingChat(null);
                }
              }}
            />
          )}
          {showLoginDialog && (
            <LoginDialog onClose={() => setShowLoginDialog(false)} />
          )}
          <Toaster position='top-center' />
        </div>
      </SocketProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
