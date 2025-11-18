import { ApiProperty } from '@nestjs/swagger';

export class UserProfileBasicDto {
  @ApiProperty({
    description: 'User ID',
    example: 'f04c3870-83f0-498f-929d-4260056d5410',
  })
  id: string;

  @ApiProperty({
    description: 'Username',
    example: 'student',
  })
  username: string;

  @ApiProperty({
    description: 'User roles/scopes',
    example: ['sales_orders.sync'],
    type: [String],
  })
  roles: string[];
}

export class UserProfileFullDto extends UserProfileBasicDto {
  @ApiProperty({
    description: 'Account creation date',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  passwordHash: string;
}

export class AllUsersResponseDto {
  @ApiProperty({
    description: 'List of all users with full details',
    type: [UserProfileFullDto],
  })
  users: UserProfileFullDto[];

  @ApiProperty({
    description: 'Total number of users',
    example: 3,
  })
  total: number;
}
