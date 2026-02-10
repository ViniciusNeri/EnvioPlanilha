// src/modules/accounts/services/IAuthenticateUserService.ts
import type { Signup } from '../../entities/Signup.js';
import { User } from '../../entities/User.js';

export interface IAuthenticateResponse {
  user: {
    name: string;
    email: string;
    id: string;
  };
  token: string;
}

export interface IAuthenticateUserService {
  execute(email: string, password: string): Promise<IAuthenticateResponse>;
  signup(data: User): Promise<Signup>;
  signupWithCode(signup: Signup): Promise<IAuthenticateResponse>;
}