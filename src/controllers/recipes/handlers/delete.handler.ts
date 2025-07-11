import { NotFoundException } from "@nestjs/common";
import { prisma } from "../../../lib/prisma";

export const del = async (idString: string) => {
	const recipe = await prisma.recipe.findUnique({
		where: { id: idString },
	})
	if (!recipe) {
		throw new NotFoundException("Recipe not found");
	}
	await prisma.recipe.delete({
		where: { id: idString },
	})
};