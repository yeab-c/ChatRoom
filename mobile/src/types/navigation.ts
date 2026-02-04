import { Href } from 'expo-router';
import { ChatType } from './chat';

export type RootStackParamList = {
  '(tabs)': undefined;
  '(auth)/login': undefined;
  '(auth)/signup': undefined;
  'chat/[id]': { id: string; chatType?: ChatType };
  'chat/info': { chatId: string };
  'group/[id]': { id: string };
  'group/create': undefined;
  'group/info': { groupId: string };
  'matching/searching': undefined;
  'matching/temp-chat': { chatId: string };
  'matching/timeout': undefined;
  'settings/edit-profile': undefined;
  'settings/blocked-users': undefined;
};