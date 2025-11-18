import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiExtraModels,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt.guard';
import {
  LoginDto,
  SignupDto,
  AuthResponseDto,
  UserProfileBasicDto,
  UserProfileFullDto,
  AllUsersResponseDto,
} from './dtos';

@ApiTags('Auth')
@ApiExtraModels(
  AuthResponseDto,
  UserProfileBasicDto,
  UserProfileFullDto,
  AllUsersResponseDto,
)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login with username and password',
    description:
      'Authenticate a user and receive a JWT token containing user information and system configuration.(student123/student)',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Successfully authenticated. Returns JWT token.',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request body',
  })
  async login(@Body() { username, password }: LoginDto) {
    return this.authService.login(username, password);
  }

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Sign up a new user',
    description:
      'Create a new user account. Returns JWT token with embedded system config.',
  })
  @ApiBody({ type: SignupDto })
  @ApiCreatedResponse({
    description:
      'User successfully created. Returns JWT token with embedded system config.',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request body or username already exists',
  })
  async signUp(@Body() { username, password }: SignupDto) {
    return this.authService.signUp(username, password);
  }

  @Get('users/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns the authenticated user profile information.',
  })
  @ApiQuery({
    name: 'details',
    required: false,
    description: 'Include additional details. Use "full" to get extended info.',
    example: 'full',
  })
  @ApiOkResponse({
    description:
      'User profile returned. Response varies based on details parameter.',
    schema: {
      oneOf: [
        { $ref: '#/components/schemas/UserProfileBasicDto' },
        { $ref: '#/components/schemas/AllUsersResponseDto' },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token',
  })
  async getCurrentUser(
    @Req() req: Request,
    @Query('details') details?: string,
  ) {
    const user = req.user as { sub?: string } | undefined;
    return this.authService.getUserProfile(user?.sub ?? '', details);
  }
}
