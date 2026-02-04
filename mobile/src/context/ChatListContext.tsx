import React, { createContext, useContext, ReactNode } from 'react';
import { useChatList } from '../hooks/useChatList';

type ChatListContextType = ReturnType<typeof useChatList>;

const ChatListContext = createContext<ChatListContextType | undefined>(undefined);

export const ChatListProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const chatListState = useChatList();

  return (
    <ChatListContext.Provider value={chatListState}>
      {children}
    </ChatListContext.Provider>
  );
};

export const useChatListContext = () => {
  const context = useContext(ChatListContext);
  if (!context) {
    throw new Error('useChatListContext must be used within ChatListProvider');
  }
  return context;
};
