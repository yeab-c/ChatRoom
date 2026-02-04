// Group member
export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  role: 'member' | 'admin';
  user: {
    id: string;
    name: string;
    avatar: string;
    isOnline: boolean;
  };
  joinedAt: Date;
}

// Group details
export interface GroupDetails {
  id: string;
  name: string;
  description: string | null;
  avatar: string;
  creatorId: string;
  members: GroupMember[];
  memberCount: number;
  mongoGroupId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create group data
export interface CreateGroupData {
  name: string;
  description?: string;
  memberIds: string[];
  creatorId: string;
}

// Update group data
export interface UpdateGroupData {
  name?: string;
  description?: string;
  avatar?: string;
}

// Group list item
export interface GroupListItem {
  id: string;
  name: string;
  avatar: string;
  memberCount: number;
  lastMessage?: {
    content: string;
    senderName: string;
    createdAt: Date;
  };
  updatedAt: Date;
}
