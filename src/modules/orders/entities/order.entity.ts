import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  customerId: string;

  @Column()
  orderNumber: string;

  @Column()
  status: string;

  @Column('numeric', { precision: 10, scale: 2 })
  totalAmount: number;

  @CreateDateColumn()
  createdAt: Date;
}
