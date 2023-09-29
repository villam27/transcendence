import {
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

@Injectable()
export class ChannelService {
  constructor(
    @InjectRepository(ChannelEntity)
    private ChannelRepository: Repository<ChannelEntity>,
    private userService: UserService,
    private msgService: MessagesService,
  ) {}

  async createChannel(
    channel: CreateChannelDto,
    user: UserEntity
  ): Promise<ChannelEntity> {
    const chan = this.ChannelRepository.create({
      ...channel,
    });
    chan.owner = user;
    chan.admins = [];
    chan.admins.push(user);
    chan.users = [];
    chan.users.push(user);
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
    const channel = await this.msgService.getMsg(id)
    //console.log(channel);
    //console.log(await this.userService.getUsersInChannels(id));
    return channel;
  }

  async getChannelUsers(id: number): Promise<UserEntity[]> {
    const users = await this.userService.getUsersInChannels(id);
    return users;
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

  async addUserInChannel(
    userid: number,
    id: number,
  ): Promise<ChannelEntity> {
    const channel = await this.getChannelById(id);
    const user = await this.userService.getUserById(userid);
    if (channel.priv_msg == true)
      throw new Error('This channel is a private message channel');
    try
    {
      //if (!channel.users) channel.users = [];
      //channel.users = [...channel.users, user];
      const currentUsers = channel.users || [];
      console.log("Curr " + channel.users + ".");
      currentUsers.push(user);
      channel.users = currentUsers;
      await this.ChannelRepository.save(channel);
    } catch(e) {
      console.log("Error: " + e);
    }
    return channel;
  }

  async addAdminInChannel(userid: number, id: number): Promise<ChannelEntity> {
    const channel = await this.getChannelById(id);
    const user = await this.userService.getUserById(userid);
    if (channel.priv_msg == true)
      throw new Error('This channel is a private message channel');
    try
    {
      if (!channel.admins) channel.admins = [];
      channel.admins = [...channel.admins, user];
      await this.ChannelRepository.save(channel);
    } catch(e) {
      console.log("Error: " + e);
    }
    return channel;
  }

  async KickUserFromChannel(uid: number, id: number): Promise<ChannelEntity> {
    const channel = await this.getChannelById(id);
    const user = await this.userService.getUserById(uid);
    if (channel.priv_msg == true)
      throw new Error('This channel is a private message channel');
      try
      {
        if (!channel.users) channel.users = [];
        channel.users.indexOf(user) !== -1 &&
          channel.users.splice(channel.users.indexOf(user), 1);
        await this.ChannelRepository.save(channel);
      } catch(e) {
        console.log("Error: " + e);
      }
    return channel;
  }

  async isMuted(user: UserEntity, chan: ChannelEntity): Promise<number> {
    for (var i = 0; i < chan.mutedUsers.length; i++) {
      if (chan.mutedUsers[i].user == user) return i;
    }
    return -1;
  }

  async MuteUserFromChannel(
    uid: number,
    id: number,
    sec: number,
  ): Promise<ChannelEntity> {
    const channel = await this.getChannelById(id);
    const user = await this.userService.getUserById(uid);
    if (channel.priv_msg == true)
      throw new Error('This channel is a private message channel');
    //  Todo: Check if admin can be muted
    if (channel.admins.includes(user) || channel.owner == user)
      throw new Error('The user is admin or owner');
    if (channel.baned.includes(user)) throw new Error('The user is banned');
    if (sec <= 0)
      throw new Error('Time in second cannot be equal or inferior to zero');
    //  Todo: Check if user is already muted, if it is juste update the Date
    const date = new Date(); // Get the current date
    date.setSeconds(date.getSeconds() + sec); // Add time in second to the date
    let muteEntity: MutedEntity;
    muteEntity.channel = channel;
    muteEntity.user = user;
    muteEntity.endDate = date;
    channel.mutedUsers = [...channel.mutedUsers, muteEntity];
    await this.ChannelRepository.save(channel);
    return channel;
  }

  async UnMuteUserFromChannel(uid: number, id: number): Promise<ChannelEntity> {
    const channel = await this.getChannelById(id);
    const user = await this.userService.getUserById(uid);
    if (channel.priv_msg == true)
      throw new Error('This channel is a private message channel');
    var idx = await this.isMuted(user, channel);
    if (idx == -1) throw new Error('The user is not muted');
    channel.mutedUsers.splice(idx, 1);
    await this.ChannelRepository.save(channel);
    return channel;
  }

  async BanUserFromChannel(uid: number, id: number): Promise<ChannelEntity> {
    const channel = await this.getChannelById(id);
    const user = await this.userService.getUserById(uid);
    if (channel.priv_msg == true)
      throw new Error('This channel is a private message channel');
    try
    {
      if (!channel.users) channel.users = [];
      if (!channel.baned) channel.baned = [];
      channel.users.indexOf(user) !== -1 &&
        channel.users.splice(channel.users.indexOf(user), 1);
      channel.baned = [...channel.baned, user];
      await this.ChannelRepository.save(channel);
    } catch(e) {
      console.log("Error: " + e);
    }
    await this.ChannelRepository.save(channel);
    return channel;
  }

  //  Todo: check why isnt working
  async UnBanUserFromChannel(uid: number, id: number): Promise<ChannelEntity> {
    const channel = await this.getChannelById(id);
    const user = await this.userService.getUserById(uid);
    if (channel.priv_msg == true)
      throw new Error('This channel is a private message channel');
    try
    {
      if (!channel.baned) channel.baned = [];
      channel.baned.indexOf(user) !== -1 &&
        channel.baned.splice(channel.baned.indexOf(user), 1);
      await this.ChannelRepository.save(channel);
    } catch(e) {
      console.log("Error: " + e);
    }
    console.log("hes unbanned");
    return channel;
  }

  async AddMessageToChannel(message: string, user: UserEntity, chan: ChannelEntity) {
    //if (!msg.channel.users.includes(msg.sender))
    //  throw new Error('The user is not in channel');
    //if ((await this.isMuted(msg.sender, msg.channel)) >= 0)
    //  throw new Error('The user is muted');
    //console.log(message + " " + user + " " + chan);
    this.msgService.addMsg(message, user, chan);
  }
}
