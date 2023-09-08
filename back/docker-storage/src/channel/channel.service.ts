import { ConflictException, Injectable, NotFoundException, UnauthorizedException, } from '@nestjs/common';
import { ChannelEntity } from 'src/database/entities/channel.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/database/entities/user.entity';
import { ChannelDto, CreateChannelDto, UpdateChannelDto } from './dto/channel.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class ChannelService {
    constructor (
        @InjectRepository(ChannelEntity)
        private ChannelRepository: Repository<ChannelEntity>,
        private userService: UserService
    ) {
    }

    async createChannel(channel: CreateChannelDto, user: UserEntity): Promise<ChannelEntity> {
        try {
            await this.ChannelRepository.findOne({ where: { channel_name: channel.channel_name } });
        }
        catch (e) {            
                const chan = this.ChannelRepository.create({
                    ...channel
                })
                chan.owner = user
                chan.admins = []
                chan.admins.push(user)
                try {
                    await this.ChannelRepository.save(chan);
                } catch (e) {
                    throw new ConflictException('alreday used')
                }
                return chan;
        }
        throw new ConflictException(`Le channel_name: ${channel.channel_name} est déjà utilisé.`)
    }

    async getChannelById(id: number): Promise<ChannelEntity> {
        const channel = await this.ChannelRepository.findOne({
            where: { id },
            relations: ['admins']
        });
        if (!channel)
            throw new NotFoundException(`Le channel d'id ${id}, n'existe pas`)
        return channel
    }

    async updateChannel(id: number, channelDto: UpdateChannelDto, user: UserEntity): Promise<ChannelEntity> {
        const chan = await this.getChannelById(id);
        const channelToUpdate = await this.ChannelRepository.preload({
            id, // search user == id
            ...channelDto // modif seulement les differences
        })
        if (!channelToUpdate)
            throw new NotFoundException(`la channel d'id: ${id} n'existe pas`)        
        if (this.userService.isChanOwner(user, chan) || this.userService.isChanAdmin(user, chan))
            return await this.ChannelRepository.save(channelToUpdate) // la modification fonctionne en revanche
        else
            throw new UnauthorizedException(`You're not authorize to update this channel because you're the owner or an admin`)
    }

    async addUserInChannel(user: UserEntity, id: number): Promise<ChannelEntity> {
        const channel = await this.getChannelById(id);
        channel.users = [...channel.users, user]
        // channel.users.push(user);
        return channel;
    }

}
``