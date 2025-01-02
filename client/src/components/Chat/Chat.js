import React, { useState, useEffect, useRef } from 'react';
import './Chat.css';
import { API_NINJA_KEY } from '../../config/api';
import {
  MdMoreVert,
  MdSend,
  MdEdit,
  MdDelete,
  MdCheck,
  MdClose,
} from 'react-icons/md';
import { format } from 'date-fns';
import { getAvatarUrl } from '../../config/avatar';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';
import { playNotification } from '../../utils/notification';
import { toast } from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';

function Chat({
  chat,
  onMessageSent,
  onChatUpdate,
  onChatDelete,
  onBotResponse,
  onChatsUpdate,
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const { socket } = useSocket();

  useEffect(() => {
    setMessages(chat.messages || []);
  }, [chat]);

  useEffect(() => {
    if (!socket) return;

    socket.on('newAutoMessage', ({ chatId, messages: newMessages }) => {
      if (chat._id === chatId && Array.isArray(newMessages)) {
        setMessages((prevMessages) => [...prevMessages, ...newMessages]);
        scrollToBottom();
      }
    });

    return () => {
      socket.off('newAutoMessage');
    };
  }, [socket, chat._id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStartEditing = (message) => {
    setEditingMessage(message);
    setNewMessage(message.text);
  };

  const handleCancelEditing = () => {
    setEditingMessage(null);
    setNewMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (editingMessage) {
      // Оновлюємо повідомлення
      try {
        const response = await fetch(
          `${process.env.REACT_APP_SERVER_URL}/api/messages/${chat._id}/${editingMessage._id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ text: newMessage }),
          }
        );

        if (response.ok) {
          const updatedChat = await response.json();
          setMessages(updatedChat.messages);
          setEditingMessage(null);
          setNewMessage('');
          toast.success('Message updated successfully');
          playNotification();
        }
      } catch (error) {
        console.error('Error updating message:', error);
        toast.error('Failed to update message');
      }
    } else {
      // Відправляємо нове повідомлення
      const message = {
        text: newMessage,
        sender: 'user',
      };

      try {
        const response = await fetch(
          `${process.env.REACT_APP_SERVER_URL}/api/messages/${chat._id}`,
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
          setMessages(updatedChat.messages);
          setNewMessage('');

          // Get quote from API Ninja через серверний проксі
          setTimeout(async () => {
            try {
              const token = localStorage.getItem('token');
              console.log('Token:', token);

              if (!token) {
                throw new Error('No token found');
              }

              const quoteResponse = await fetch(
                `${process.env.REACT_APP_SERVER_URL}/api/quotes`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (!quoteResponse.ok) {
                const errorData = await quoteResponse.json();
                console.error('Quote API Error:', errorData);
                throw new Error(errorData.message || 'Failed to fetch quote');
              }

              const quoteData = await quoteResponse.json();

              const botResponse = await fetch(
                `${process.env.REACT_APP_SERVER_URL}/api/messages/${chat._id}`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                  },
                  body: JSON.stringify({
                    text: quoteData.quote,
                    sender: 'bot',
                  }),
                }
              );

              if (botResponse.ok) {
                const updatedChat = await botResponse.json();
                setMessages(updatedChat.messages);
                onBotResponse(chat, quoteData.quote);
                playNotification();
              }
            } catch (error) {
              console.error('Error getting quote:', error);
              // Використовуємо запасну відповідь, якщо API не працює
              const fallbackQuotes = [
                'Happiness is a journey, not a destination.',
                'The best way to cheer yourself up is to try to cheer somebody else up.',
                'Happiness is not something ready made. It comes from your own actions.',
                'The most important thing is to enjoy your life - to be happy.',
                'Happiness is when what you think, what you say, and what you do are in harmony.',
              ];

              const randomQuote =
                fallbackQuotes[
                  Math.floor(Math.random() * fallbackQuotes.length)
                ];

              const botResponse = await fetch(
                `${process.env.REACT_APP_SERVER_URL}/api/messages/${chat._id}`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                  },
                  body: JSON.stringify({
                    text: randomQuote,
                    sender: 'bot',
                  }),
                }
              );

              if (botResponse.ok) {
                const updatedChat = await botResponse.json();
                setMessages(updatedChat.messages);
                onBotResponse(chat, randomQuote);
                playNotification();
              }
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleEditChat = () => {
    onChatUpdate(chat);
    setShowMenu(false);
  };

  const handleDeleteChat = () => {
    setShowMenu(false);
    setShowConfirmDialog(true);
  };

  const updateMessagesReadStatus = async (updatedChat) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_SERVER_URL}/api/chats/${chat._id}/messages/read`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ messages: updatedChat.messages }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update messages status');
      }

      const updatedChatData = await response.json();

      // Оновлюємо список чатів
      const chatsResponse = await fetch(
        `${process.env.REACT_APP_SERVER_URL}/api/chats`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (chatsResponse.ok) {
        const updatedChats = await chatsResponse.json();
        onChatsUpdate(updatedChats); // Оновлюємо список чатів

        // Знаходимо оновлений чат і оновлюємо локальний стан
        const currentChat = updatedChats.find((c) => c._id === chat._id);
        if (currentChat) {
          setMessages(currentChat.messages);
        }
      }
    } catch (error) {
      console.error('Error updating messages status:', error);
    }
  };

  // Функція для оновлення статусу прочитання
  const markMessagesAsRead = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_SERVER_URL}/api/chats/${chat._id}/messages/read`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update messages status');
      }

      // Оновлюємо список чатів
      const chatsResponse = await fetch(
        `${process.env.REACT_APP_SERVER_URL}/api/chats`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (chatsResponse.ok) {
        const updatedChats = await chatsResponse.json();
        onChatsUpdate(updatedChats);
      }
    } catch (error) {
      console.error('Error updating messages status:', error);
    }
  };

  // Ефект для позначення повідомлень як прочитаних при відкритті чату
  useEffect(() => {
    if (chat?._id) {
      const hasUnreadMessages = chat.messages?.some(
        (msg) => !msg.isRead && msg.sender === 'bot'
      );

      if (hasUnreadMessages) {
        markMessagesAsRead();
      }
    }
  }, [chat?._id]);

  // Ефект для оновлення локального стану повідомлень
  useEffect(() => {
    if (chat?.messages) {
      setMessages(chat.messages);
    }
  }, [chat?.messages]);

  // При монтуванні компонента позначаємо всі повідомлення як прочитані
  useEffect(() => {
    if (chat?._id) {
      const markMessagesAsRead = async () => {
        try {
          const response = await fetch(
            `${process.env.REACT_APP_SERVER_URL}/api/chats/${chat._id}/messages/read`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            }
          );

          if (response.ok) {
            const updatedChat = await response.json();
            onChatsUpdate((prevChats) =>
              prevChats.map((c) => (c._id === chat._id ? updatedChat : c))
            );
            setMessages(updatedChat.messages);
          }
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      };

      markMessagesAsRead();
    }
  }, [chat?._id]);

  return (
    <div className='chat'>
      <div className='chat-header'>
        <div className='chat-header-info'>
          <div className='chat-avatar'>
            <img
              src={getAvatarUrl(chat.firstName, chat.lastName)}
              alt='avatar'
            />
          </div>
          <div className='chat-user-info'>
            <h2>
              {chat.firstName} {chat.lastName}
            </h2>
            <span className='chat-status'>online</span>
          </div>
        </div>
        <div className='chat-header-actions' ref={menuRef}>
          <button
            className='menu-button'
            onClick={() => setShowMenu(!showMenu)}
          >
            <MdMoreVert size={24} />
          </button>
          {showMenu && (
            <div className='chat-menu'>
              <button onClick={handleEditChat}>
                <MdEdit size={20} />
                Edit
              </button>
              <button onClick={handleDeleteChat}>
                <MdDelete size={20} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className='messages-container'>
        {messages.map((msg, index) => (
          <div
            key={msg._id || `msg-${index}`}
            className={`message-wrapper ${
              msg.sender === 'user' ? 'user' : 'bot'
            }`}
          >
            <div
              className={`message ${msg === editingMessage ? 'editing' : ''}`}
            >
              <div className='message-content'>{msg.text}</div>
            </div>
            <div className='message-footer'>
              <span className='message-time'>
                {format(new Date(msg.timestamp), 'h:mm a')}
              </span>
              {msg.sender === 'user' && (
                <>
                  <span>•</span>
                  <button
                    className='message-edit-link'
                    onClick={() => handleStartEditing(msg)}
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {editingMessage && (
        <div className='edit-message-header'>
          <div className='edit-info'>
            <div className='edit-title'>Edit message</div>
            <div className='edit-text'>{editingMessage.text}</div>
          </div>
          <button className='close-edit' onClick={handleCancelEditing}>
            <MdClose size={20} />
          </button>
        </div>
      )}

      <form
        className={`message-form ${editingMessage ? 'editing' : ''}`}
        onSubmit={handleSubmit}
      >
        <div className='input-wrapper'>
          <input
            type='text'
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder='Type a message...'
            onKeyDown={(e) => {
              if (e.key === 'Escape' && editingMessage) {
                handleCancelEditing();
              }
            }}
          />
          <button type='submit'>
            {editingMessage ? <MdCheck size={20} /> : <MdSend size={20} />}
          </button>
        </div>
      </form>

      {showConfirmDialog && (
        <ConfirmDialog
          message={`Are you sure you want to delete chat with ${chat.firstName} ${chat.lastName}?`}
          onConfirm={() => {
            setShowConfirmDialog(false);
            onChatDelete();
          }}
          onClose={() => setShowConfirmDialog(false)}
        />
      )}
    </div>
  );
}

export default Chat;
