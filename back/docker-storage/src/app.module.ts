import { Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm'; // ==> npm install --save @nestjs/typeorm typeorm mysql2
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true // module vue par tous les modules
    }),
    TypeOrmModule.forRoot({ // config DB mysql
    type: 'mysql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: ["dist/**/*.entity{.ts,.js}"], // a chaque modif des fichiers entity, mettre a jour la DB
    synchronize: true,
  }),
  AuthModule,
  UserModule
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [AppService]
})
export class AppModule {}
