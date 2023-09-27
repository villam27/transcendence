import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { CreateChannelDto, UpdateChannelDto } from './dto/channel.dto';
import { UserAddChanDto, UserChanDto } from 'src/user/dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guards';
import { ChannelEntity, MessageEntity } from '../database/entities/channel.entity';
import { User } from '../utils/decorators/user.decorator';
import { UserEntity } from '../database/entities/channel.entity';

@Controller('channel')
export class ChannelController {
  constructor(private channelService: ChannelService) {
  }

  @Get('/:id')
  async GetChannelById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ChannelEntity> {
    // ==> renvoi toutes les infos channels
    return await this.channelService.getChannelById(id);
  }

  @Get('/name/:id')
  //@UseGuards(JwtAuthGuard)
  async GetChannelByName(
    @Param('id') id: string,
  ) {
    // ==> renvoi toutes les infos channels
    return await this.channelService.getChannelByName(id);
  }

  @Get('/msg/:id')
  async GetChannelMessages(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MessageEntity[]> {
    console.log("get message ^^");
    return await this.channelService.getChannelMessages(id);
  }

  //  Add get channel
  //          User Admin Ban Muted
  @Get('/users/:id')
  async GetChannelUsers(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserEntity[]> {
    console.log("get users ^^");
    return await this.channelService.getChannelUsers(id);
  }

  //  TODO CHANGE TO GET
  @Post('/of_user')
  @UseGuards(JwtAuthGuard)
  async GetChannelOfUser(
    @User() user: UserEntity
  ): Promise<ChannelEntity[]> {
    console.log("get chans of users ^^");
    return await this.channelService.getChannelOfUser(user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async CreateChannel(
    @Body() createChannelDto: CreateChannelDto,
    @User() user: UserEntity
  ): Promise<ChannelEntity> {
    const chan = await this.channelService.createChannel(
      createChannelDto,
      user
    );
    //console.log('chan: ', chan);
    //console.log('chan.admins: ', chan.admins);
    return chan;
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
  @UseGuards(JwtAuthGuard)
  async addUserInChannel(
    @User() user: UserEntity,
    @Body() uDto: UserChanDto,
    @Param('id', ParseIntPipe) id: number,
    //@User() user: UserChanDto,
  ) {
    const chat = this.channelService.addUserInChannel(user.id, id);
    console.log("Add user " + user.username + " in channel id: ", id);
    return chat;
  }

  @Post('/add_admin/:id')
  @UseGuards(JwtAuthGuard)
  async AddAdminInChannel(
    @User() user: UserEntity,
    @Body() uDto: UserChanDto,
    @Param('id', ParseIntPipe) id: number
  ) {
    const chan = await this.channelService.addAdminInChannel(uDto.id, id);
    //console.log(chan.users);
    return chan;
  }

  @Patch('kick/:id') // id_chan
  @UseGuards(JwtAuthGuard)
  async KickUserFromChannel(
    @User() user: UserEntity,
    @Body() uDto: UserChanDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.channelService.KickUserFromChannel(uDto.id, id);
  }

  //  TODO RECODE MUTE DEMUTE
  @Patch('mute/:id') // id_chan
  @UseGuards(JwtAuthGuard)
  async MuteUserFromChannel(
    @User() user: UserChanDto,
    @Param('id_chan', ParseIntPipe) id: number,
    @Param('time_sec', ParseIntPipe) time_sec: number,
  ) {
    return this.channelService.MuteUserFromChannel(user.id, id, time_sec);
  }

  @Patch('unmute/:id') // id_chan
  @UseGuards(JwtAuthGuard)
  async UnMuteUserFromChannel(
    @User() user: UserChanDto,
    @Param('id_chan', ParseIntPipe) id: number,
  ) {
    return this.channelService.UnMuteUserFromChannel(user.id, id);
  }

  @Patch('ban/:id') // id_chan
  @UseGuards(JwtAuthGuard)
  async BanUserFromChannel(
    @Body() uDto: UserChanDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.channelService.BanUserFromChannel(uDto.id, id);
  }

  @Patch('unban/:id') // id_chan
  @UseGuards(JwtAuthGuard)
  async UnBanUserFromChannel(
    @Body() uDto: UserChanDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    console.log("here");
    return this.channelService.UnBanUserFromChannel(uDto.id, id);
  }
}
