import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PayloadDto } from "../dto/Payload.dto";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
    constructor(config: ConfigService, private readonly prisma: PrismaService) {
        const secret = config.get("JWT_SECRET")
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: secret,
            ignoreExpiration: false,
        }) 
    }
    
    async validate(payload: PayloadDto) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: payload.email
            },
            omit: {
                password: true
            }
        })
        return user
    }
}