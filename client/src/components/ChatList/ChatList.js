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
                src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTIgMGMtNi42MjYgMC0xMiA1LjM3My0xMiAxMiAwIDUuMzAyIDMuNDM4IDkuOCA4LjIwNyAxMS4zODcuNTk5LjExMS43OTMtLjI2MS43OTMtLjU3N3YtMi4yMzRjLTMuMzM4LjcyNi00LjAzMy0xLjQxNi00LjAzMy0xLjQxNi0uNTQ2LTEuMzg3LTEuMzMzLTEuNzU2LTEuMzMzLTEuNzU2LTEuMDg5LS43NDUuMDgzLS43MjkuMDgzLS43MjkgMS4yMDUuMDg0IDEuODM5IDEuMjM3IDEuODM5IDEuMjM3IDEuMDcgMS44MzQgMi44MDcgMS4zMDQgMy40OTIuOTk3LjEwNy0uNzc1LjQxOC0xLjMwNS43NjItMS42MDQtMi42NjUtLjMwNS01LjQ2Ny0xLjMzNC01LjQ2Ny01LjkzMSAwLTEuMzExLjQ2OS0yLjM4MSAxLjIzNi0zLjIyMS0uMTI0LS4zMDMtLjUzNS0xLjUyNC4xMTctMy4xNzYgMCAwIDEuMDA4LS4zMjIgMy4zMDEgMS4yMy45NTctLjI2NiAxLjk4My0uMzk5IDMuMDAzLS40MDQgMS4wMi4wMDUgMi4wNDcuMTM4IDMuMDA2LjQwNCAyLjI5MS0xLjU1MiAzLjI5Ny0xLjIzIDMuMjk3LTEuMjMuNjUzIDEuNjUzLjI0MiAyLjg3NC4xMTggMy4xNzYuNzcuODQgMS4yMzUgMS45MTEgMS4yMzUgMy4yMjEgMCA0LjYwOS0yLjgwNyA1LjYyNC01LjQ3OSA1LjkyMS40My4zNzIuODIzIDEuMTAyLjgyMyAyLjIyMnYzLjI5M2MwIC4zMTkuMTkyLjY5NC44MDEuNTc2IDQuNzY1LTEuNTg5IDguMTk5LTYuMDg2IDguMTk5LTExLjM4NiAwLTYuNjI3LTUuMzczLTEyLTEyLTEyeiIvPjwvc3ZnPg=='
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
