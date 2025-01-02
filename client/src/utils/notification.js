const notificationSound = new Audio('/sounds/notification.mp3');

export const playNotification = () => {
  notificationSound.play().catch((error) => {
    console.error('Error playing notification:', error);
  });
};
