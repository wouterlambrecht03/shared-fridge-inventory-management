import { plainToInstance } from "class-transformer";
import { UserBody } from "../../../contracts/user.body";
import { UserView } from "../../../contracts/user.view";
import { prisma } from "../../../lib/prisma";
import bcrypt from "bcryptjs";

export const create = async (body: UserBody): Promise<UserView>  => {
	const hashedPassword = await bcrypt.hash(body.password, 10);

	const user = await prisma.user.create({
		data: {
			firstName: body.firstName,
			lastName: body.lastName,
			email: body.email,
			password: hashedPassword,
		},
	});

	return plainToInstance(UserView, user);
};