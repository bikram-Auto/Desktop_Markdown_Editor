import { apiClient } from './client';

export interface CreateUserDTO {
  name: string;
  email: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  message?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export const createUser = async (data: CreateUserDTO): Promise<UserResponse> => {
  return apiClient<UserResponse>('/users/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const setPassword = async (id: string, password: string): Promise<any> => {
  return apiClient(`/users/set-password?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify({ password }),
  });
};

export const loginUser = async (data: { email: string; password: string }): Promise<{ user: User; token: string }> => {
  return apiClient<{ user: User; token: string }>('/users/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
