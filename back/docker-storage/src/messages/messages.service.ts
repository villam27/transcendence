import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthService } from '../auth/auth.service';
import { MessageEntity } from '../database/entities/message.entity';
import { UserEntity } from '../database/entities/user.entity';
import { Repository } from 'typeorm';
import { AddMsgDto } from './dto/add-msg.dto';
import { ChannelEntity } from '../database/entities/channel.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(MessageEntity)
    private messageRepository: Repository<MessageEntity>,
    private authService: AuthService,
  ) {}

  async addMsg(msg: AddMsgDto) {
    const newMsg = this.messageRepository.create(msg);
    console.log(newMsg);
    return await this.messageRepository.save(newMsg);
  }
}
