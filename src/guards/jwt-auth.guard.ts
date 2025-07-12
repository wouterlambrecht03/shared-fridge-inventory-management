import {
	Injectable,
	CanActivate,
	ExecutionContext,
	UnauthorizedException,
} from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import config from "../config.json";
import { prisma } from "../lib/prisma";

@Injectable()
export class JwtAuthGuard implements CanActivate {
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const token = request.headers["x-auth"];

		if (!token) {
			throw new UnauthorizedException("Token not provided");
		}

		try {
			const payload = jwt.verify(token, config.jwtSecret) as any;
			request.user = payload;

			const user = await prisma.user.findUnique({
				where: { 
					id: payload.userId
				}
			});

			if (!user) {
				throw new UnauthorizedException("User no longer exists");
			}
			return true;
		} catch (error) {
			throw new UnauthorizedException("Invalid token");
		}
	}
}