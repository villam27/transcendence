import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ChannelModule } from './channel/channel.module';
import { MessagesModule } from './messages/messages.module';
import { GameModule } from './game/game.module';
import { UserGateway } from './user/user.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // module vue par tous les modules
    }),
    DatabaseModule,
    AuthModule,
    UserModule,
    ChannelModule,
    MessagesModule,
    ChannelModule,
    GameModule,
  ],
  controllers: [AppController],
  providers: [AppService, UserGateway], // on mettra les gateway ici
  exports: [AppService],
})
export class AppModule {}
