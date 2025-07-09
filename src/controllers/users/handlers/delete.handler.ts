import { NotFoundException } from "@nestjs/common";
import { prisma } from "../../../lib/prisma";

export const del = async (idString: string) => {
	const user = await prisma.user.findUnique({
		where: { id: idString },
	})
	if (!user) {
		throw new NotFoundException("User not found");
	}
	await prisma.user.delete({
		where: { id: idString },
	})
};