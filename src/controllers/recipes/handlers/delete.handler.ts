import { NotFoundException, UnauthorizedException } from "@nestjs/common";
import { prisma } from "../../../lib/prisma";

export const del = async (userId: string, idString: string) => {
	const recipe = await prisma.recipe.findUnique({
		where: { id: idString },
	})
	if (!recipe) {
		throw new NotFoundException("Recipe not found");
	}
    if (recipe.userId !== userId) {
        throw new UnauthorizedException("You are not the owner of this recipe");
    }
	await prisma.recipe.delete({
		where: { id: idString },
	})
};