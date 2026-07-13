import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case';
import { LoginRequestDto } from './dtos/login.request.dto';
import { LoginResponseDto } from './dtos/login.response.dto';
import { RefreshTokenRequestDto } from './dtos/refresh-token.request.dto';
import { RefreshTokenResponseDto } from './dtos/refresh-token.response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginRequestDto): Promise<LoginResponseDto> {
    return this.loginUseCase.execute(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenRequestDto): RefreshTokenResponseDto {
    return this.refreshTokenUseCase.execute(dto.refreshToken);
  }
}
