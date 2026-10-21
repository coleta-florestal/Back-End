import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthRequest } from '../types/auth-user';

export const GetUser = createParamDecorator(
  (data: any, ctx: ExecutionContext) => {
    const req: Express.Request = ctx.switchToHttp().getRequest<AuthRequest>();

    return req.user;
  },
);
