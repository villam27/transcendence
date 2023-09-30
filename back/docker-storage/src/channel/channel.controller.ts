import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ChannelService } from './channel.service';
import { CreateChannelDto, UpdateChannelDto } from './dto/channel.dto';
import { UserChanDto } from 'src/user/dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guards';
import {
  ChannelEntity,
  MessageEntity,
} from '../database/entities/channel.entity';
import { User } from '../utils/decorators/user.decorator';
import { UserEntity } from '../database/entities/channel.entity';
import { AdminGuard, TargetIsAdminGuard } from './guards/chan-admin.guards';
import { InChannelGuard, IsBannedGuard, IsNotBannedGuard, PrivateGuard, SelfBannedGuard, SelfCommand } from './guards/chan-basic.guards';

@Controller('channel')
export class ChannelController {
  constructor(private channelService: ChannelService) {}

  @Get('/:id')
  async GetChannelById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ChannelEntity> {
    // ==> renvoi toutes les infos channels
    return await this.channelService.getChannelById(id);
  }

  @Get('/name/:id')
  //@UseGuards(JwtAuthGuard)
  async GetChannelByName(@Param('id') id: string) {
    // ==> renvoi toutes les infos channels
    return await this.channelService.getChannelByName(id);
  }

  @Get('/msg/:id')
  async GetChannelMessages(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MessageEntity[]> {
    //console.log('get message ^^');
    return await this.channelService.getChannelMessages(id);
  }

  //  Add get channel
  //          User Admin Ban Muted
  @Get('/users/:id')
  async GetChannelUsers(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserEntity[]> {
    return await this.channelService.getChannelUsers(id);
  }

  //  TODO CHANGE TO GET
  @Post('/of_user')
  @UseGuards(JwtAuthGuard)
  async GetChannelOfUser(@User() user: UserEntity): Promise<ChannelEntity[]> {
    return await this.channelService.getChannelOfUser(user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async CreateChannel(
    @Body() createChannelDto: CreateChannelDto,
    @User() user: UserEntity,
  ): Promise<ChannelEntity> {
    return await this.channelService.createChannel(
      createChannelDto,
      user,
    );
  }

  @Patch('/:id') // id_chan
  @UseGuards(JwtAuthGuard)
  async UpdateChannel(
    @Body() updateChannelDto: UpdateChannelDto,
    @Param('id', ParseIntPipe) id: number,
    @User() user: UserChanDto,
  ): Promise<ChannelEntity> {
    return await this.channelService.updateChannel(
      id,
      updateChannelDto,
      user.id,
    );
  }

  //todo check why old users are removed
  @Post('/add_user/:id')
  @UseGuards(PrivateGuard, SelfBannedGuard)
  @UseGuards(JwtAuthGuard)
  async addUserInChannel(
    @User() user: UserEntity,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const chat = this.channelService.addUserInChannel(user.id, id);
    return chat;
  }

  @Post('/add_admin/:id')
  @UseGuards(AdminGuard, PrivateGuard, InChannelGuard, IsNotBannedGuard, SelfCommand, TargetIsAdminGuard)
  @UseGuards(JwtAuthGuard)
  async AddAdminInChannel(
    @Body() uDto: UserChanDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const chan = await this.channelService.addAdminInChannel(uDto.id, id);
    return chan;
  }

  @Post('/kick/:id') // id_chan
  @UseGuards(AdminGuard, PrivateGuard, InChannelGuard, SelfCommand, TargetIsAdminGuard)
  @UseGuards(JwtAuthGuard)
  async KickUserFromChannel(
    @Body() uDto: UserChanDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.channelService.KickUserFromChannel(uDto.id, id);
  }

  //  TODO: Add dto
  @Post('mute/:id') // id_chan
  @UseGuards(AdminGuard, PrivateGuard, InChannelGuard, IsNotBannedGuard, SelfCommand, TargetIsAdminGuard)
  @UseGuards(JwtAuthGuard)
  async MuteUserFromChannel(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.channelService.MuteUserFromChannel(body.id, id, body.time);
  }

  @Post('unmute/:id') // id_chan
  @UseGuards(JwtAuthGuard)
  async UnMuteUserFromChannel(
    @Body() uDto: UserChanDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.channelService.UnMuteUserFromChannel(uDto.id, id);
  }

  @Post('ban/:id') // id_chan
  @UseGuards(AdminGuard, PrivateGuard, InChannelGuard, IsNotBannedGuard, SelfCommand, TargetIsAdminGuard)
  @UseGuards(JwtAuthGuard)
  async BanUserFromChannel(
    @Body() uDto: UserChanDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.channelService.BanUserFromChannel(uDto.id, id);
  }

  @Post('unban/:id') // id_chan
  @UseGuards(AdminGuard, PrivateGuard, IsBannedGuard, IsNotBannedGuard, SelfCommand, TargetIsAdminGuard)
  @UseGuards(JwtAuthGuard)
  async UnBanUserFromChannel(
    @Body() uDto: UserChanDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.channelService.UnBanUserFromChannel(uDto.id, id);
  }
}
