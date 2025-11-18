import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import { UserEntity } from '../auth/user.entity';
import { OrderEntity } from '../orders/entities/order.entity';

@Injectable()
export class DatabaseSeederService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeederService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(OrderEntity)
    private readonly ordersRepository: Repository<OrderEntity>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedInitialUsersIfNeeded();
    await this.seedDemoOrdersIfNeeded();
  }

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

  private async seedInitialUsersIfNeeded() {
    const count = await this.usersRepository.count();
    if (count > 0) {
      return;
    }

    const salt = this.getGlobalSalt();

    const student = this.usersRepository.create({
      username: 'student',
      passwordHash: this.hashPassword('student123', salt),
      roles: ['sales_orders.sync'],
    });

    const admin = this.usersRepository.create({
      username: 'admin',
      // Precomputed SHA-256 for the default training salt so we don't
      // expose the clear-text admin password in the source code.
      passwordHash:
        '5e303153c621ce14d1f24523e2ebff1b803550a0d40b5a341b1b4443b902df17',
      roles: ['sales_orders.sync', 'admin'],
    });

    await this.usersRepository.save([student, admin]);
    this.logger.log('Seeded demo users: student and admin');
  }

  private async seedDemoOrdersIfNeeded() {
    const count = await this.ordersRepository.count();
    if (count > 0) {
      return;
    }

    const student = await this.usersRepository.findOne({
      where: { username: 'student' },
    });

    if (!student) {
      this.logger.warn('Student user not found; skipping demo orders seeding');
      return;
    }

    const demoOrders: Partial<OrderEntity>[] = [
      {
        customerId: student.id,
        orderNumber: 'SO-1001',
        status: 'OPEN',
        totalAmount: 1200.5,
      },
      {
        customerId: student.id,
        orderNumber: 'SO-1002',
        status: 'PROCESSING',
        totalAmount: 540.0,
      },
      {
        customerId: 'other-user-id',
        orderNumber: 'SO-2001',
        status: 'OPEN',
        totalAmount: 999.99,
      },
      {
        customerId: 'other-user-id',
        orderNumber: 'SO-2002',
        status: 'CLOSED',
        totalAmount: 150.25,
      },
    ];

    await this.ordersRepository.save(demoOrders);
    this.logger.log('Seeded demo orders for security lab');
  }
}
