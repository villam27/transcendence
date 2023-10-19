import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards } from '@nestjs/common';
import { ChannelService } from 'src/channel/channel.service';
import { MessagesService } from 'src/messages/messages.service';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { BlockGuard, ChatCheckGuard } from './guards/chat.guards';
import { FRONT_URL } from '../utils/Globals';
import { ChanStateEnum } from 'src/utils/enums/channel.enum';

export interface ChannelMessage {
  sender_id: number;
  sender_urlImg: string;
  sender_username: string;
  message_content: string;
  channel_id: number;
  channel_name: string;
  priv_msg: boolean
}

@Injectable()
@WebSocketGateway({
  cors: {
    credentials: true,
    origin: [FRONT_URL],
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private chanService: ChannelService,
    private messService: MessagesService,
    private userService: UserService,
    private jwtService: JwtService,
  ) { }

  @WebSocketServer()
  server: Server;
  clients: Socket[] = [];
  messages: { msg: string; sock_id: string }[] = [];

  async handleConnection(client: Socket) {
    this.clients.push(client);
    this.server.emit('connect_ok');
  }

  async handleDisconnect(client: Socket) {
    const id = this.clients.indexOf(client);
    this.clients.splice(id);
    this.server.emit('disconnect_ok');
  }

  @SubscribeMessage('join')
  async handleJoin(client: Socket, body: any) {
    const { channel } = body;
    const chan = await this.chanService.getChannelByName(channel);

    client.rooms.forEach((room) => {
      if (room !== client.id) {
        client.leave(room);
      }
    });
    client.join(channel);
    this.server.to(channel).emit('join', chan.id);
  }

  @SubscribeMessage('leave')
  async handleLeave(client: Socket) {
    client.rooms.forEach((room) => {
      if (room !== client.id) {
        client.leave(room);
      }
    });
  }

  @SubscribeMessage('remove')
  async handleRemove(client: Socket, body: any) {
    const { user } = body;
    this.server.emit('remove', user);
  }

  @UseGuards(ChatCheckGuard, BlockGuard)
  @SubscribeMessage('message')
  async handleMessage(client: Socket, body: any) {
    const { message, channel } = body;
    let chanE;

    if (message.length > 256) return;
    if (channel < 0) {
      console.log('error chan < 0');
      return;
    }
    //  Check if socket is in room
    const current_room = this.server.sockets.adapter.rooms.get(channel);
    if (!current_room?.has(client.id)) return;
    try {
      chanE = await this.chanService.getChannelByName(channel);
    } catch (error) {
      console.log(error);
      return;
    }

    const token = String(client.handshake.query.token);
    const payload = this.jwtService.verify(token, {
      secret: process.env.JWT_SECRET,
    });
    const userE = await this.userService.getUserByUsername(payload.username);
    this.chanService.AddMessageToChannel(message, userE, chanE);
    this.messages.push({ msg: message, sock_id: client.id });
    const data: ChannelMessage = {
      sender_id: userE.id,
      sender_urlImg: userE.urlImg,
      sender_username: userE.username,
      message_content: message,
      channel_id: chanE.id,
      channel_name: chanE.channel_name,
      priv_msg: chanE.priv_msg
    };
    this.server.to(channel).emit('message', data);

    let usersList = await this.userService.getFullUsersInChannels(chanE.id);
    let tmp = await this.userService.getFullAdminInChannels(chanE.id);
    usersList.concat(tmp);
    usersList = [...usersList, chanE.owner];
    usersList.forEach(usr => {
      if (userE.id !== usr.id) {
        const userRoom = 'user' + usr.id;
        client.join(userRoom);
        console.log('chanE.priv_msg: ', chanE.priv_msg);
        
        this.server.to(userRoom).emit('notifMsg', data);
      }
    });
  }
}
