import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  isNumber,
} from 'class-validator';
import { UserRoleEnum, UserStateEnum } from '../../utils/enums/user.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  urlImg!: string;

  @IsOptional()
  @IsBoolean()
  is2fa_active!: boolean;

  @IsOptional()
  @IsString()
  secret2fa: string;

  @IsOptional()
  @IsEnum(UserRoleEnum)
  user_role: UserRoleEnum;

  @IsOptional()
  @IsNumber()
  winrate: number;
}

export class UserChanDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;
}

export class UserAddChanDto {
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsString()
  @IsOptional()
  password: string;
}

export class PublicProfileDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsString()
  socketId: string;

  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  urlImg: string;

  @IsNotEmpty()
  @IsEnum(UserStateEnum)
  user_status: UserStateEnum;

  @IsNotEmpty()
  @IsNumber()
  winrate: number;

  @IsNotEmpty()
  @IsBoolean()
  is_friend: boolean;

  @IsNumber()
  @IsNotEmpty()
  gamesPlayed: number;

  @IsNumber()
  @IsNotEmpty()
  elo: number;

  @IsNotEmpty()
  gamesId: number[];
}

export class UpdatePwdDto {
  @IsString()
  newPassword: string;

  @IsString()
  oldPassword: string;
}

export class GetUserIdFromSocketIdDto {
  @IsNotEmpty()
  @IsString()
  socketId: string;
}

export class UserGameStatus {
  @IsNumber()
  gameInvitationTo: number;

  @IsNumber()
  gameInvitationFrom: number;

  @IsString()
  gameInviteType: string;
}
