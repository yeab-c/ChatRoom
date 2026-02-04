import apiClient from './client';

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
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar: string;
  creatorId: string;
  members: GroupMember[];
  memberCount: number;
  mongoGroupId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupData {
  name: string;
  description?: string;
  memberIds: string[]; // Max 9 members (creator + 9 others = 10 total)
}

export interface UpdateGroupData {
  name?: string;
  description?: string;
  avatar?: string;
}

class GroupService {
  /**
   * Create a new group
   * Backend endpoint: POST /api/groups
   */
  async createGroup(data: CreateGroupData): Promise<Group> {
    try {
      const response = await apiClient.post('/groups', data);

      // Backend returns: { success: true, data: Group, message: "Group created" }
      console.log('Group created successfully');
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to create group:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get user's groups
   * Backend endpoint: GET /api/groups
   */
  async getUserGroups(): Promise<Group[]> {
    try {
      const response = await apiClient.get('/groups');

      // Backend returns: { success: true, data: Group[] }
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get groups:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get group details by ID
   * Backend endpoint: GET /api/groups/:id
   */
  async getGroupById(groupId: string): Promise<Group> {
    try {
      const response = await apiClient.get(`/groups/${groupId}`);

      // Backend returns: { success: true, data: Group }
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get group:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Update group details (creator only)
   * Backend endpoint: PUT /api/groups/:id
   */
  async updateGroup(groupId: string, updates: UpdateGroupData): Promise<Group> {
    try {
      const response = await apiClient.put(`/groups/${groupId}`, updates);

      // Backend returns: { success: true, data: Group, message: "Group updated" }
      console.log('Group updated successfully');
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to update group:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Delete group (creator only)
   * Backend endpoint: DELETE /api/groups/:id
   */
  async deleteGroup(groupId: string): Promise<void> {
    try {
      await apiClient.delete(`/groups/${groupId}`);
      console.log('Group deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete group:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Add member to group (creator only)
   * Backend endpoint: POST /api/groups/:id/members
   */
  async addMember(groupId: string, userId: string): Promise<void> {
    try {
      await apiClient.post(`/groups/${groupId}/members`, { userId });
      console.log('Member added successfully');
    } catch (error: any) {
      console.error('Failed to add member:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Remove member from group (creator only)
   * Backend endpoint: DELETE /api/groups/:id/members
   */
  async removeMember(groupId: string, userId: string): Promise<void> {
    try {
      await apiClient.delete(`/groups/${groupId}/members`, {
        data: { userId },
      });
      console.log('Member removed successfully');
    } catch (error: any) {
      console.error('Failed to remove member:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Leave group (any member can leave)
   * Note: This uses the remove member endpoint with your own userId
   */
  async leaveGroup(groupId: string, userId: string): Promise<void> {
    try {
      await this.removeMember(groupId, userId);
      console.log('Left group successfully');
    } catch (error: any) {
      console.error('Failed to leave group:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default new GroupService();












