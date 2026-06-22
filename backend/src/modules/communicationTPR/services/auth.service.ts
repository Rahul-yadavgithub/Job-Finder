import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository';
import { LoginInput } from '../validators/auth.validator';
import { v4 as uuidv4 } from 'uuid';
import { CommunicationTPRJWTPayload } from '../types';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async login(input: LoginInput) {
    const user = await this.userRepository.findByEmail(input.email);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.status !== 'approved') {
      throw new Error(`Account is ${user.status}`);
    }

    const isMatch = await bcrypt.compare(input.password, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const payload: CommunicationTPRJWTPayload = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: 'communication_tpr',
      tokenVersion: user.token_version || 0
    };

    const token = jwt.sign(
      payload,
      process.env.ADMIN_JWT_SECRET as string,
      { expiresIn: '12h', jwtid: uuidv4() }
    );

    return { token, user: payload };
  }

  async logout(userId: string) {
    await this.userRepository.updateTokenVersion(userId);
  }
}
