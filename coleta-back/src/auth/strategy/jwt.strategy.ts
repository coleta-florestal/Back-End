import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PayloadDto } from "../dto/payload.dto";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
    constructor(config: ConfigService) {
        const secret = config.get("JWT_SECRET")
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: secret,
            ignoreExpiration: false,
        }) 
    }
    async validate(payload: PayloadDto) {
        return {
            sub: payload.id,
            email: payload.email,
            role: payload.role
        }
    }
}