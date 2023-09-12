import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from 'src/database/entities/user.entity';
import { Repository } from 'typeorm';
import { UserSubDto } from './dtos/user-sub.dto';
import * as bcrypt from 'bcrypt';
import { LoginCreditDto } from './dtos/login-credit.dto';
import { UserStateEnum } from 'src/utils/enums/user.enum';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
    constructor (
        @InjectRepository(UserEntity)
        private userRepository: Repository<UserEntity>,
        private jwtService: JwtService,
    ) {}
    
      
    async register(userData: UserSubDto): Promise<Partial<UserEntity>> { // on veut crypter le pwd avec la bibliotheque bcrypt
        // Create User
        const user = this.userRepository.create({
            ...userData
        });
        user.salt = await bcrypt.genSalt() // genere le salt
        user.password = await bcrypt.hash(user.password, user.salt) // la on change le pwd, voila pourquoi le username: unique fonctionne mais pas celui du pwd
        user.user_status = UserStateEnum.ON
        try {
            await this.userRepository.save(user); // save user in DB
        } catch (e) {
            throw new ConflictException(`username or password already used`);
        }
        return {
            id: user.id,
            username: user.username,
            password: user.password,
        };
    }

    async login(creditentials: LoginCreditDto) {
        
        const {username, password} = creditentials
        try {
            const user = await this.userRepository.createQueryBuilder("user")
            .where("user.username = :username", {username} )
            .getOne();

            const hashedPwd = await bcrypt.hash(password, user.salt);
            if (hashedPwd === user.password) {
                const payload = {
                    username,
                    role: user.role
                }
                const jwt = this.jwtService.sign(payload);
                user.user_status = UserStateEnum.ON;
                return { 'access-token': jwt };
            } else {
                throw new NotFoundException(`wrong password`)
            }
        } catch (e) {
            throw new NotFoundException(`username not found`);
        }
    }

}
