import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from "nodemailer"

@Injectable()
export class EmailService {
    private readonly transporter: nodemailer.Transporter
    constructor(private readonly config: ConfigService) {
        this.transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: this.config.getOrThrow<string>("SMTP_USER"),
                pass: this.config.getOrThrow<string>("SMTP_PASSWORD")
            }
        })
    }

    async verifyConnection() {
        return this.transporter.verify()
    }
}
