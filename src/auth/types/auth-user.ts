import { Request } from 'express';
import { Role } from 'src/generated/prisma/enums';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: Role;
  };
}
