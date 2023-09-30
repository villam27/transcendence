import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChannelEntity } from '../database/entities/channel.entity';
import { UserEntity } from '../database/entities/user.entity';
import { Repository } from 'typeorm';
import {
  GetUserIdFromSocketIdDto,
  PublicProfileDto,
  UpdatePwdDto,
  UpdateUserDto,
  UserGameStatus,
} from './dto/user.dto';
import { UserStateEnum } from '../utils/enums/user.enum';
import { MessageEntity } from '../database/entities/message.entity';
import { validate } from 'class-validator';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import { Express } from 'express';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { Socket } from "socket.io-client"

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(ChannelEntity)
    private ChannelRepository: Repository<ChannelEntity>,
    @InjectRepository(UserEntity)
    private UserRepository: Repository<UserEntity>,
    @InjectRepository(MessageEntity)
    private MessageRepository: Repository<MessageEntity>,
  ) {
  }

  // --------- PROFILE --------- :
  // -- Private -- :

  async updateProfile(
    profil: UpdateUserDto,
    user: UserEntity,
  ) {
    const id: number = user.id;
    const errors = await validate(profil);
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }
    //console.log('modifications apportées: ', profil);

    const newProfil = await this.UserRepository.preload({
      id, // search user == id
      ...profil, // modif seulement les differences
    });
    if (!newProfil) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé.`);
    }
    if (profil.is2fa_active) {
      const { otpauthUrl } = await this.generateTwoFactorSecret(newProfil);
      const secret = /secret=(.+?)&/.exec(otpauthUrl);

      return {
        ...await this.UserRepository.save(newProfil),
        qrCode: await toDataURL(otpauthUrl),
        code2fa: secret ? secret[1]: '',
      };
    }
    return await this.UserRepository.save(newProfil);
  }

  async updatePassword(updatePwdDto: UpdatePwdDto, user: UserEntity) {
    // NEW_PASSWORD

    const id = user.id;
    const name = user.username;
    const currentUser = await this.UserRepository.createQueryBuilder('user') // honnetement je comprend pas pourquoi le salt n'est pas dans mon user du parametre...
      .where('user.username = :name', { name })
      .getOne();
    if (currentUser.id42 > 0)
      throw new UnauthorizedException('Oauth42 user can\'t change password')
    const newPassword = await bcrypt.hash(
      updatePwdDto.newPassword,
      currentUser.salt,
    );
    const newProfil = await this.UserRepository.preload({
      id, // search user == id
      password: newPassword, // modif seulement password
    });
    const oldHash = await bcrypt.hash(updatePwdDto.oldPassword, currentUser.salt);
    if (oldHash !== currentUser.password) {
      throw new UnauthorizedException(`Wrong password`);
    }

    return await this.UserRepository.save(newProfil);
  }

  async logout(user: UserEntity) {
    // pas testé
    const lastMsg = await this.getLastMsg(user);
    if (lastMsg)
      user.last_msg_date = lastMsg.createdAt;
    user.user_status = UserStateEnum.OFF;
    user.socketId = '';
    user.isInGameWith = -1;
    user.gameInvitationTo = -1;
    user.gameInvitationFrom = -1;
    await this.UserRepository.save(user);
  }

  //  USE FOR ADMIN BAN MUTE ..
  async updateUserChannel(user: UserEntity, channel: ChannelEntity) {
    try
    {
      if (!user.channels)
        user.baned = [];
      //user.channels.push(channel);
      user.baned = [...user.baned, channel];
      await this.UserRepository.save(user);
    } catch(e) {
      console.log("Error: " + e);
    }
  }

  // -- Public -- :

  async getPublicProfile(
    id: number,
    user: UserEntity,
  ): Promise<PublicProfileDto> {
    const profile = await this.UserRepository.findOne({ where: { id } });
    if (!profile) throw new NotFoundException(`le user ${id} n'existe pas`);

    const PublicProfile = new PublicProfileDto();
    PublicProfile.id = profile.id;
    PublicProfile.username = profile.username;
    PublicProfile.urlImg = profile.urlImg;
    PublicProfile.user_status = profile.user_status;
    PublicProfile.winrate = profile.winrate;

    if (user && user.friends && Array.isArray(user.friends)) {
      PublicProfile.is_friend = user.friends.some(
        (friend) => friend === profile.id,
      );
    } else {
      PublicProfile.is_friend = false;
    }
    return PublicProfile;
  }

  async getAllProfile(user: UserEntity): Promise<PublicProfileDto[]> {
    const users = await this.UserRepository.find();
    // Créez un tableau pour stocker les profils
    const PublicProfiles: PublicProfileDto[] = [];
    for (const profile of users) {
      const PublicProfile = await this.getPublicProfile(profile.id, user);
      PublicProfiles.push(PublicProfile);
    }
    return PublicProfiles;
  }

  // FRIEND'S DEMAND :

  async askFriend(user: UserEntity, id: number): Promise<UserEntity> {
    console.log("USER SERVICE");
    
    const userAsked = await this.UserRepository.findOne({ where: { id } });
    if (!userAsked)
    throw new NotFoundException(`le user d'id ${id} n'existe pas`);
  const isAlreadyFriend = user.friends.indexOf(id);
  if (isAlreadyFriend !== -1) {
    throw new ConflictException(
      `le user d'id ${id} est fait déjà de vos friends`,
      );
    }    
    
    // if (Array.isArray(user.invited) && Array.isArray(userAsked.invites)) {
      //   const invitedExist = user.invited.indexOf(userAsked.id);
      //   const invitesExist = userAsked.invites.indexOf(user.id);
      //   if (invitesExist != -1 || invitedExist != -1)
      //     throw new ConflictException(`Vous avez déjà demandé le user ${id}.`);
      user.invited.push(userAsked.id);
      userAsked.invites.push(user.id);
      console.log("user.invited :", user.invited);
      console.log(" userAsked.invites : ", userAsked.invites);
      
      // user.invited = [...user.invited as number[], userAsked.id];
      // userAsked.invites = [...userAsked.invites as number[], id];
      // }
      // }
      await this.UserRepository.save(user);
      await this.UserRepository.save(userAsked);

      // si les deux user se sont invit = auto accept
      // if (userAsked.invited.includes(user.id))
      // {
      //   await this.handleAsk(user, id, true);
      //   await this.handleAsk(userAsked, user.id, true);
      // }
    return userAsked;
  }

  async handleAsk(
    user: UserEntity, // usr1
    id: number, // sender
    bool: boolean,
  ) {
    console.log("USER Service handle ask");
    const sender = await this.UserRepository.findOne({ where: { id } });
    if (!sender) {
      throw new NotFoundException(`le user d'id: ${id} n'existe pas`);
    }
    console.log("user ", user.id, " user.invited :", user.invited);
    console.log("sender ", id ," sender.invites : ", sender.invited);

    const indexSenderInInvites = user.invited.indexOf(id); // get l'index du sender dans la liste d'invites de usr1
    if (indexSenderInInvites === -1) {
      throw new NotFoundException(
        `le sender d'id ${id} ne fait parti de la liste d'invites du user (receiver) d'id ${user.id}`,
      );
    }
    const indexReceiverInInvited = sender.invites.indexOf(user.id); // get l'index du user (receiver) dans la liste d'invited du sender
    if (indexReceiverInInvited === -1) {
      throw new NotFoundException(
        `Vous ne ne faite pas parti de la liste d'invited du sender d'id ${id}`,
      );
    }
    user.invited.splice(indexSenderInInvites, 1); // remove sender dans liste d'invites du receiver
    sender.invites.splice(indexReceiverInInvited, 1); // remove receiver dans liste d'invited du sender
    console.log("user ", user.id, " user.invited :", user.invited);
    console.log("sender ", id ," sender.invites : ", sender.invites);
    if (bool == true) {
      if (!user.friends) user.friends = [];
      user.friends = [...user.friends, sender.id]; // ajout sender dans list friends de usr1
      if (!sender.friends) sender.friends = [];
      sender.friends = [...sender.friends, user.id]; // ajout usr1 dans list friends de sender
    }
    this.UserRepository.save(user);
    this.UserRepository.save(sender);
    return user
  }

  // CHANNEL & MESSAGE :

  async getChannels(user: UserEntity): Promise<ChannelEntity[]> {
    return await this.ChannelRepository.createQueryBuilder('channels')
      .leftJoinAndSelect('channels.users', 'user')
      .where('user.id = :userId', { userId: user.id })
      .getMany();
  }

  async isInChannel(id: number, channel: ChannelEntity) {
    const user = await this.ChannelRepository.findOne({ where: { id } });
    return !!user;

  }

  async getUsersInChannels(channelId: number) {
    const users = this.UserRepository.createQueryBuilder('user')
                                    .innerJoin('user.channels', 'channel')
                                    .where('channel.id = :channelId', { channelId })
                                    .select(['user.id', 'user.username', 'user.urlImg'])
                                    .getMany();
    //console.log("USER: " + users);
    return users;
  }

  // des qu'il se log ==> return ChannelEntity[] (ou y'a des news msgs) ou null si aucun message
  async isNotifMsg(user: UserEntity): Promise<ChannelEntity[]> | null {
    // est ce quil a des new msg et si oui de quel cahnnel
    const userChannels = await this.getChannels(user);
    const lastMsg = await this.getLastMsg(user);
    let channelsWithNewMsg: ChannelEntity[];
    if (lastMsg.createdAt > user.last_msg_date) {
      // il y a des msg qu'il n'a pas vu. Mais de quel channel ?
      // pour chaque channel aller voir s'il y a des new msg;
      for (const channel of userChannels) {
        const messagesInChannel = await this.MessageRepository.find({
          where: { channel: { id: channel.id } },
          order: { createdAt: 'DESC' }, // Triez par date de création décroissante pour obtenir le dernier message
          take: 1, // Récupérez seulement le premier (le plus récent) message
        });
        if (messagesInChannel[0].createdAt > user.last_msg_date)
          // stocker les channel et les retourner
          channelsWithNewMsg.push(channel);
      }
      return channelsWithNewMsg;
    } else return null;
  }

  async getLastMsg(user: UserEntity): Promise<MessageEntity> {
    // pas testé
    const userChannels = await this.getChannels(user);
    if (!userChannels || userChannels.length === 0) return null;
    let latestMessage: MessageEntity | null = null;
    // Itérer sur les chaînes pour trouver le dernier message
    for (const channel of userChannels) {
      const messagesInChannel = await this.MessageRepository.find({
        where: { channel: { id: channel.id } },
        order: { createdAt: 'DESC' }, // Triez par date de création décroissante pour obtenir le dernier message
        take: 1, // Récupérez seulement le premier (le plus récent) message
      });
      if (messagesInChannel && messagesInChannel.length > 0) {
        const lastMessageInChannel = messagesInChannel[0];
        if (
          !latestMessage ||
          lastMessageInChannel.createdAt > latestMessage.createdAt
        ) {
          latestMessage = lastMessageInChannel;
        }
      }
    }
    return latestMessage;
  }

  async getMsgsByChannel(
    // pas testé
    user: UserEntity,
    channels: ChannelEntity[],
    id: number,
  ): Promise<MessageEntity[]> {
    const channel = await this.ChannelRepository.findOne({ where: { id } });
    if (!channel)
      throw new NotFoundException(`le channel d'id ${id} n'existe pas`);
    if (this.isInChannel(user.id, channel)) return channel.messages;
    else
      throw new NotFoundException(
        `le user ${id} n'appartient pas a ce channel`,
      );
  }

  async blockAUser(
    id: number,
    user: UserEntity
  ) {
    try {
      const userToBlock = await this.UserRepository.findOne({ where: {id} });
      if (!userToBlock)
        throw new ConflictException(`user ${id} does not exist`);
      const isHeInBlocked = this.UserRepository.createQueryBuilder('user');
      let userId = user.id;
      isHeInBlocked
        .where('user.id = :userId', { userId })
        .andWhere(':id = ANY(user.blocked)', { id });
      const result = await isHeInBlocked.getOne();
      console.log("user.blocked : ", user.blocked);
      console.log("idToBlock : ", id);

      if (!result)
      {
        user.blocked = [...user.blocked, userToBlock.id];
        await this.UserRepository.save(user);
      } else {
        throw new ConflictException(`user ${id} already in blocked`);
      }
    } catch (e) {
      throw new ConflictException(`user ${id} already in blocked`);
    }
  }

  // UTILS :

  isOwner(objet: any, user: UserEntity): boolean {
    return objet.user && user.id === objet.user.id;
  }

  isChanOwner(user: UserEntity, channel: ChannelEntity): boolean {
    return channel.owner.id == user.id;
  }

  isChanAdmin(user: UserEntity, channel: ChannelEntity): boolean {
    if (!channel.admins) return false;
    // Vérifiez si l'utilisateur existe dans la liste des administrateurs
    return channel.admins.some(
      (adminUser) => adminUser.id === user.id,
    );
  }


  async updatePicture(user: UserEntity, file: Express.Multer.File) {
    if (
      user.urlImg != '' &&
      !user.urlImg.startsWith('https://cdn.intra.42.fr') &&
      user.urlImg !== 'http://localhost:3001/public/default.png'
    ) {
      fs.rm(user.urlImg.replace('http://localhost:3001/', ''), (err) => {
        if (err) console.error('remove old: ', err);
      });
    }
    user.urlImg = 'http://localhost:3001/' + file.path;
    await this.UserRepository.save(user);
    return user;
  }

  async getUserFromSocketId(socketId: GetUserIdFromSocketIdDto) {
    return await this.UserRepository.findOne({ where: { socketId: socketId.socketId } });
  }

  async setUserSocketId(id: number, socketId: string) {
    const user = await this.UserRepository.findOne({ where: { id: id } });
    if (!user) {
      console.error('user not found in setUserSocketId');
      return;
    }
    user.socketId = socketId;
    user.user_status = UserStateEnum.ON; // todo : virer ca

    return await this.UserRepository.save(user);
  }

  async getSocketIdFromUser(id: number) {
    const user = await this.UserRepository.findOne({ where: { id: id } });
    if (!user) {
      console.error('user not found in setUserSocketId');
      return;
    }
    return user.socketId;
  }

  async getUserById(id: number): Promise<UserEntity> {
    const user = await this.UserRepository.findOne({
      where: { id },
    });
    if (!user) throw new NotFoundException(`No User found for id ${id}`);
    return user;
  }

  async getUserByUsername(username: string): Promise<UserEntity> {
    const user = await this.UserRepository.findOne({
      where: { username },
    });
    if (!user) throw new NotFoundException(`No User found for username ${username}`);
    return user;
  }

  async generateTwoFactorSecret(user: UserEntity) {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.username, 'Transcendence', secret);
    user.secret2fa = secret;
    await this.UserRepository.save(user);
    return { secret, otpauthUrl };
  }

  // Game Invites Management ---------------------------------------------------------------------------------------- //
  async setUserSendInvitationTo(user: UserEntity, otherUserId: number | undefined) {
    user.gameInvitationTo = otherUserId ? otherUserId : -1;
    return await this.UserRepository.save(user);
  }

  async setUserReceivedInvitationFrom(user: UserEntity, otherUserId: number | undefined) {
    user.gameInvitationFrom = otherUserId ? otherUserId : -1;
    return await this.UserRepository.save(user);
  }

  async setUserInGameStatus(user: UserEntity, otherUserId: number | undefined) {
    user.isInGameWith = otherUserId ? otherUserId : -1;
    return await this.UserRepository.save(user);
  }

  async setUserInvitationType(user: UserEntity, gameType: 'none' | 'normal' | 'special') {
    user.gameInvitationType = gameType;
    return await this.UserRepository.save(user);
  }

  async getGameStatusWithId(id: number): Promise<UserGameStatus> {
    const user = await this.getUserById(id);
    return {
      gameInvitationFrom: user.gameInvitationFrom,
      gameInvitationTo: user.gameInvitationTo,
      isInGameWith: user.isInGameWith,
      gameInviteType: user.gameInvitationType
    }
  }
}
