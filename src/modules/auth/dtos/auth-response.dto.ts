import { ApiProperty } from '@nestjs/swagger';

export class AuthSystemConfigDto {
  @ApiProperty({
    description: 'Hash algorithm used for password hashing',
    example: 'sha256',
  })
  hash_algorithm: string;

  password_salt: string;
}

export class AuthSystemDto {
  @ApiProperty({
    description: 'System authentication configuration',
    type: AuthSystemConfigDto,
  })
  auth_config: AuthSystemConfigDto;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token containing user info.',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIiwidXNlcm5hbWUiOiJzdHVkZW50Iiwicm9sZXMiOlsic2FsZXNfb3JkZXJzLnN5bmMiXSwiX3N5c3RlbSI6eyJhdXRoX2NvbmZpZyI6eyJoYXNoX2FsZ29yaXRobSI6InNoYTI1NiIsInBhc3N3b3JkX3NhbHQiOiJ0cmFpbmluZy1sYWItc2FsdC1jaGFuZ2UtbWUifX0sImlhdCI6MTYxMjM0NTY3OCwiZXhwIjoxNjEyMzQ5Mjc4fQ.signature',
  })
  access_token: string;

  @ApiProperty({
    description: 'Token type (always Bearer)',
    example: 'Bearer',
  })
  token_type: string;
}
