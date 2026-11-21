import { api } from './client';
import type { LoginResponse, SessionUser } from '../types';

export const loginRequest = (name: string, pin: string) => api<LoginResponse>('login', { name, pin });
export const logoutRequest = () => api<{ loggedOut: boolean }>('logout');
export const meRequest = () => api<SessionUser>('me');
export const changePinRequest = (currentPin: string, newPin: string) =>
  api<{ changed: boolean }>('changePin', { currentPin, newPin });
