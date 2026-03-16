import { apiClient } from './client';

export interface PreferencesPayload {
  userId: string;
  name?: string;
  layout: Record<string, any>;
}

export interface PreferencesResponse {
  statusCode: number;
  Message: string;
  id: string | null;
}

export const createPreferences = async (id: string, data: PreferencesPayload): Promise<PreferencesResponse> => {
  return apiClient<PreferencesResponse>(`/preferences/create/${id}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updatePreferences = async (id: string, data: PreferencesPayload): Promise<PreferencesResponse> => {
  return apiClient<PreferencesResponse>(`/preferences/update/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export interface SavedPreference {
  id: string;
  name?: string;
  userId: string;
  layout: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export const getPreferences = async (userId: string): Promise<SavedPreference[]> => {
  return apiClient<SavedPreference[]>(`/preferences/${userId}`, {
    method: 'GET',
  });
};
