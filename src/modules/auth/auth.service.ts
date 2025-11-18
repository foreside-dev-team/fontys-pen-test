import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private getGlobalSalt(): string {
    const salt = this.configService.get<string>('PASSWORD_SALT');

    if (!salt) {
      this.logger.warn(
        'PASSWORD_SALT is not set; using insecure default salt for training only',
      );

      return 'changeme-admin-salt';
    }

    return salt;
  }

  private hashPassword(password: string, salt: string): string {
    return createHash('sha256')
      .update(salt + password)
      .digest('hex');
  }

  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);

    const payload = {
      sub: user.id,
      username: user.username,
      roles: user.roles ?? [],
      _system: {
        auth_config: {
          hash_algorithm: 'sha256',
          password_salt: this.getGlobalSalt(),
        },
      },
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
    };
  }

  async signUp(username: string, password: string) {
    const existing = await this.usersRepository.findOne({
      where: { username },
    });

    if (existing) {
      throw new ConflictException('Username already exists');
    }

    const salt = this.getGlobalSalt();
    const passwordHash = this.hashPassword(password, salt);

    const user = this.usersRepository.create({
      username,
      passwordHash,
      roles: ['sales_orders.sync'],
    });

    const saved = await this.usersRepository.save(user);

    const payload = {
      sub: saved.id,
      username: saved.username,
      roles: saved.roles ?? [],
      _system: {
        auth_config: {
          hash_algorithm: 'sha256',
          password_salt: this.getGlobalSalt(),
        },
      },
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
    };
  }

  private async validateUser(
    username: string,
    password: string,
  ): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const salt = this.getGlobalSalt();
    const hash = this.hashPassword(password, salt);

    if (hash !== user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async getUserProfile(userId: string, details?: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (
      details &&
      (details.toLowerCase().includes('full') ||
        details.toLowerCase().includes('all'))
    ) {
      const allUsers = await this.usersRepository.find();

      // Return all users with sensitive information
      return allUsers.map((u) => ({
        id: u.id,
        username: u.username,
        roles: u.roles,
        createdAt: u.createdAt,
        passwordHash: u.passwordHash,
      }));
    }

    // Normal case: return only current user without sensitive data
    return {
      id: user.id,
      username: user.username,
      roles: user.roles,
      createdAt: user.createdAt,
    };
  }
}
