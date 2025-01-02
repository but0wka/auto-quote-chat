import React, { useEffect } from 'react';
import './ChatList.css';
import { formatDistanceToNow } from 'date-fns';
import { getAvatarUrl } from '../../config/avatar';
import { useSocket } from '../../context/SocketContext';
import { toast } from 'react-hot-toast';
import { playNotification } from '../../utils/notification';

function ChatList({ chats, onChatSelect, selectedChat, onChatsUpdate }) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on(
      'newAutoMessage',
      async ({ chatId, messages: newMessages, chatName }) => {
        if (!Array.isArray(newMessages)) return;

        onChatsUpdate((prevChats) =>
          prevChats.map((chat) => {
            if (chat._id === chatId) {
              return {
                ...chat,
                messages: [...(chat.messages || []), ...newMessages],
              };
            }
            return chat;
          })
        );

        if (
          newMessages.length >= 2 &&
          (!selectedChat || selectedChat._id !== chatId)
        ) {
          const botMessage = newMessages[1];
          toast(
            (t) => (
              <div
                className='chat-notification'
                onClick={() => {
                  const chat = chats.find((c) => c._id === chatId);
                  if (chat) {
                    handleChatSelect(chat);
                  }
                  toast.dismiss(t.id);
                }}
              >
                <div className='notification-avatar'>
                  <img
                    src={getAvatarUrl(
                      chatName.split(' ')[0],
                      chatName.split(' ')[1]
                    )}
                    alt='avatar'
                  />
                </div>
                <div className='notification-content'>
                  <div className='notification-header'>
                    <span className='notification-name'>{chatName}</span>
                  </div>
                  <div className='notification-message'>{botMessage.text}</div>
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

          playNotification();
        }
      }
    );

    return () => {
      socket.off('newAutoMessage');
    };
  }, [socket, selectedChat, onChatsUpdate, chats]);

  const handleChatSelect = (chat) => {
    onChatSelect(chat);
  };

  const getLastMessage = (chat) => {
    if (chat.messages && chat.messages.length > 0) {
      return chat.messages[chat.messages.length - 1];
    }
    return null;
  };

  return (
    <div className='chat-list'>
      {chats.map((chat) => {
        const lastMessage = getLastMessage(chat);
        const isSelected = selectedChat && selectedChat._id === chat._id;

        return (
          <div
            key={chat._id}
            className={`chat-item ${isSelected ? 'selected' : ''}`}
            onClick={() => handleChatSelect(chat)}
          >
            <div className='chat-item-avatar'>
              <img
                src={getAvatarUrl(chat.firstName, chat.lastName)}
                alt='avatar'
              />
              <div className='online-indicator'></div>
            </div>
            <div className='chat-item-content'>
              <div className='chat-item-header'>
                <span className='chat-item-name'>
                  {chat.firstName} {chat.lastName}
                </span>
                {lastMessage && (
                  <span className='chat-item-time'>
                    {formatDistanceToNow(new Date(lastMessage.timestamp), {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </div>
              <div className='chat-item-message'>
                {lastMessage ? lastMessage.text : 'No messages yet'}
              </div>
            </div>
          </div>
        );
      })}

      <div className='github-badge'>
        <a
          href='https://github.com/but0wka/auto-quote-chat'
          target='_blank'
          rel='noopener noreferrer'
        >
          <div className='github-card'>
            <div className='github-card-header'>
              <img
                src='https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
                alt='GitHub'
                className='github-logo'
              />
              <span className='github-repo-name'>but0wka/auto-quote-chat</span>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}

export default ChatList;
