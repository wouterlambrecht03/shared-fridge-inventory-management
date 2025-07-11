import { plainToInstance } from "class-transformer";
import { UserView } from "../../../contracts/user.view";

import { NotFoundException } from "@nestjs/common";
import { prisma } from "../../../lib/prisma";
import bcrypt from "bcryptjs";
import { UpdateUserBody } from "../../../contracts/updateUser.body";

export const update = async (idString: string, body: UpdateUserBody): Promise<UserView>  => {
    const user = await prisma.user.findUnique({
      where: { id: idString },
    })
    if (!user) {
      throw new NotFoundException("User not found");
    }
	const updateData: any = {};
	if (body.firstName !== undefined) updateData.firstName = body.firstName;
	if (body.lastName !== undefined) updateData.lastName = body.lastName;
	if (body.email !== undefined) updateData.email = body.email;
	if (body.password !== undefined) {
		updateData.password = await bcrypt.hash(body.password, 10);
	}
	const updated = await prisma.user.update({
      where: { id: idString },
	  data: updateData
	})
	return plainToInstance(UserView, updated);
};