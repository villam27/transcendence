import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ChannelEntity,
  MessageEntity,
} from 'src/database/entities/channel.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/database/entities/user.entity';
import { CreateChannelDto, UpdateChannelDto } from './dto/channel.dto';
import { UserService } from 'src/user/user.service';
import { MutedEntity } from 'src/database/entities/muted.entity';
import { MessagesService } from 'src/messages/messages.service';
import { UserAddChanDto } from 'src/user/dto/user.dto';
import { MutedService } from 'src/muted/muted.service';

@Injectable()
export class ChannelService {
  constructor(
    @InjectRepository(ChannelEntity)
    private ChannelRepository: Repository<ChannelEntity>,
    private userService: UserService,
    private msgService: MessagesService,
    private mutedService: MutedService,
  ) {}

  async createChannel(
    channel: CreateChannelDto,
    user: UserEntity,
  ): Promise<ChannelEntity> {
    const chan = this.ChannelRepository.create({
      ...channel,
    });
    chan.owner = user;
    chan.admins = [];
    try {
      await this.ChannelRepository.save(chan);
    } catch (e) {
      throw new ConflictException('alreday used');
    }
    return chan;
  }

  async getChannelById(id: number): Promise<ChannelEntity> {
    var channel = await this.ChannelRepository.findOne({
      where: { id },
      //relations: ['admins'],
    });
    if (!channel)
      throw new NotFoundException(`Le channel d'id ${id}, n'existe pas`);
    return channel;
  }

  async getChannelByName(channel_name: string) {
    var channel = await this.ChannelRepository.findOne({
      where: { channel_name },
      //relations: ['admins'],
    });
    if (!channel)
      throw new NotFoundException(`Le channel ${channel_name}, n'existe pas`);
    return channel;
  }

  async getChannelMessages(id: number): Promise<MessageEntity[]> {
    const channel = await this.msgService.getMsg(id);
    //console.log(channel);
    //console.log(await this.userService.getUsersInChannels(id));
    return channel;
  }

  async getChannelUsers(id: number): Promise<UserEntity[]> {
    const users = await this.userService.getUsersInChannels(id);
    return users;
  }

  async getChannelOfUser(id: number): Promise<ChannelEntity[]> {
    var chans = await this.ChannelRepository.createQueryBuilder('channel')
      .leftJoinAndSelect('channel.users', 'users')
      .where('users.id = :id', { id })
      .select(['channel.id as id', 'channel.channel_name as name'])
      .getRawMany();
    var admchans = await this.ChannelRepository.createQueryBuilder('channel')
      .leftJoinAndSelect('channel.admins', 'admins')
      .where('admins.id = :id', { id })
      .select(['channel.id as id', 'channel.channel_name as name'])
      .getRawMany();
    var ownchans = await this.ChannelRepository.createQueryBuilder('channel')
      .leftJoinAndSelect('channel.owner', 'owner')
      .where('owner.id = :id', { id })
      .select(['channel.id as id', 'channel.channel_name as name'])
      .getRawMany();
    chans.forEach((chan) => {
      chan['type'] = 'member';
    });
    admchans.forEach((admchans) => {
      admchans['type'] = 'admin';
    });
    ownchans.forEach((ownchans) => {
      ownchans['type'] = 'owner';
    });
    const all = chans.concat(admchans, ownchans);
    return all;
  }

  async updateChannel(
    id: number,
    channelDto: UpdateChannelDto,
    uid: number,
  ): Promise<ChannelEntity> {
    const chan = await this.getChannelById(id);
    const user = await this.userService.getUserById(uid);
    const channelToUpdate = await this.ChannelRepository.preload({
      id, // search user == id
      ...channelDto, // modif seulement les differences
    });
    if (!channelToUpdate)
      throw new NotFoundException(`la channel d'id: ${id} n'existe pas`);
    if (
      this.userService.isChanOwner(user, chan) ||
      this.userService.isChanAdmin(user, chan)
    )
      return await this.ChannelRepository.save(channelToUpdate);
    // la modification fonctionne en revanche
    else
      throw new UnauthorizedException(
        `You're not authorize to update this channel because you're the owner or an admin`,
      );
  }

  async addUserInChannel(userid: number, id: number): Promise<ChannelEntity> {
    const channel = await this.getChannelById(id);
    const user = await this.userService.getUserById(userid);
    try {
      //  TODO ADD THIS TO GUARD
      var allusers = await this.userService.getUsersInChannels(id);
      if (allusers.some((u) => u.id === userid))
        throw new Error('User already in channel');
      var currentUsers = await this.userService.getFullUsersInChannels(id);
      currentUsers.push(user);
      channel.users = currentUsers;
      await this.ChannelRepository.save(channel);
    } catch (e) {
      console.log(e);
    }
    return channel;
  }

  removeFrom(users: UserEntity[], id)
  {
    const index = users.findIndex(user => user.id === id);
    if (index !== -1)
      users.splice(index, 1);
    return users;
  }

  //  Tested
  async addAdminInChannel(userid: number, id: number): Promise<ChannelEntity> {
    const channel = await this.getChannelById(id);
    const user = await this.userService.getUserById(userid);
    try {
      var currentUsers = await this.userService.getFullUsersInChannels(id);
      channel.users = this.removeFrom(currentUsers, userid);
      var currentAdmins = await this.userService.getFullAdminInChannels(id);
      currentAdmins.push(user);
      channel.admins = currentAdmins;
      await this.ChannelRepository.save(channel);
    } catch (e) {
      console.log(e);
    }
    return channel;
  }

  //  Tested
  async KickUserFromChannel(uid: number, id: number): Promise<ChannelEntity> {
    const channel = await this.getChannelById(id);
    const user = await this.userService.getUserById(uid);
    try {
      var currentUsers = await this.userService.getFullUsersInChannels(id);
      channel.users = this.removeFrom(currentUsers, uid);
      await this.ChannelRepository.save(channel);
    } catch (e) {
      console.log(e);
    }
    return channel;
  }

  async isMuted(user: UserEntity, chan: ChannelEntity): Promise<number> {
    for (var i = 0; i < chan.mutedUsers.length; i++) {
      if (chan.mutedUsers[i].user == user) return i;
    }
    return -1;
  }

  //  Do it at the end
  async MuteUserFromChannel(
    uid: number,
    id: number,
    sec: number,
  ): Promise<ChannelEntity> {
    const channel = await this.getChannelById(id);
    const user = await this.userService.getUserById(uid);
    if (sec <= 0)
      throw new BadRequestException('Time in second cannot be equal or inferior to zero');
    var muteEntity: MutedEntity = await this.mutedService.createMuted(channel, user, sec);
    return channel;
  }


  async UnMuteUserFromChannel(uid: number, id: number): Promise<ChannelEntity> {
    const channel = await this.getChannelById(id);
    const user = await this.userService.getUserById(uid);
    await this.mutedService.removeMuted(channel, user);
    return channel;
  }


  // tested
  async BanUserFromChannel(uid: number, id: number): Promise<ChannelEntity> {
    const channel = await this.getChannelById(id);
    const user = await this.userService.getUserById(uid);
    if (channel.priv_msg == true)
      throw new Error('This channel is a private message channel');
    try {
      var currentUsers = await this.userService.getFullUsersInChannels(id);
      channel.users = this.removeFrom(currentUsers, uid);
      var currentBan = await this.userService.getBannedInChannels(id);
      currentBan.push(user);
      channel.baned = currentBan;
      await this.ChannelRepository.save(channel);
    } catch (e) {
      console.log(e);
    }
    return channel;
  }

  // Tested
  async UnBanUserFromChannel(uid: number, id: number): Promise<ChannelEntity> {
    const channel = await this.getChannelById(id);
    if (channel.priv_msg == true)
      throw new Error('This channel is a private message channel');
    try {
      var currentBan = await this.userService.getBannedInChannels(id);
      channel.baned = this.removeFrom(currentBan, uid);
      await this.ChannelRepository.save(channel);
    } catch (e) {
      console.log(e);
    }
    return channel;
  }

  async AddMessageToChannel(
    message: string,
    user: UserEntity,
    chan: ChannelEntity,
  ) {
    //if (!msg.channel.users.includes(msg.sender))
    //  throw new Error('The user is not in channel');
    //if ((await this.isMuted(msg.sender, msg.channel)) >= 0)
    //  throw new Error('The user is muted');
    //console.log(message + " " + user + " " + chan);
    this.msgService.addMsg(message, user, chan);
  }
}
