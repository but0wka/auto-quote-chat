export const getAvatarUrl = (firstName, lastName) => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}${lastName}`;
};
