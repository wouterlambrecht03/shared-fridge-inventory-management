import { plainToInstance } from "class-transformer";
import { NotFoundException, UnauthorizedException } from "@nestjs/common";
import { prisma } from "../../../lib/prisma";
import { UpdateRecipeBody } from "../../../contracts/updateRecipe.body";
import { RecipeView } from "../../../contracts/recipe.view";

export const update = async (userId: string, idString: string, body: UpdateRecipeBody): Promise<RecipeView>  => {
    const recipe = await prisma.recipe.findUnique({
      where: { id: idString },
    })
    if (!recipe) {
      throw new NotFoundException("Recipe not found");
    }
    if (recipe.userId !== userId) {
        throw new UnauthorizedException("You are not the owner of this recipe");
    }

	const updateData: any = {};
	if (body.name !== undefined) updateData.name = body.name;
	if (body.description !== undefined) updateData.description = body.description;
	if (body.userId !== undefined) updateData.userId = body.userId;
	if (body.productNames !== undefined) {
		await prisma.recipeProduct.deleteMany({
			where: { recipeId: idString }
		})

		updateData.products = {
			create: body.productNames.map((p) => {return { productName: p}})
		};
	}
	const updated = await prisma.recipe.update({
      where: { id: idString },
	  data: updateData
	})
	return plainToInstance(RecipeView, updated);
};