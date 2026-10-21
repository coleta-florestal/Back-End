import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const GetUser = createParamDecorator(
    (data: any, ctx: ExecutionContext) => {
        const req: Express.Request = ctx
        .switchToHttp()
        .getRequest()

        return req.user
    }
)