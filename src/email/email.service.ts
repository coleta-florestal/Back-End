import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from "nodemailer"
import { SendEmailDto } from './dto/sendEmailDto.dto';

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
        await this.transporter.verify()
        return { message: "Conexão com gmail estabelecida" }
    }

    async sendPasswordReset(dto: SendEmailDto, token: string) {
        const frontURL = this.config.getOrThrow<string>("FRONTEND_URL")
        const resetLink = `${frontURL}/reset-password?token=${token}`

        await this.transporter.sendMail({
            from: this.config.getOrThrow<string>("MAIL_FROM"),
            to: dto.email,
            subject: 'Recuperação de senha',
            html: `
                <h2>Recuperação de senha</h2>

                <p>Recebemos uma solicitação para redefinir sua senha.</p>

                <p>Clique no botão abaixo para continuar:</p>

                <a href="${resetLink}">
                Redefinir senha
                </a>

                <p>Este link expira em 15 minutos.</p>

                <p>
                Caso não tenha solicitado a recuperação,
                ignore este e-mail.
                </p>
            `
        })
    }
}
