import { plainToInstance } from "class-transformer";
import { prisma } from "../../../lib/prisma";
import { RecipeBody } from "../../../contracts/recipe.body";
import { RecipeView } from "../../../contracts/recipe.view";

export const create = async (userId: string, body: RecipeBody): Promise<RecipeView>  => {
	const recipe = await prisma.recipe.create({
		data: {
            name: body.name,
            description: body.description,
            userId: userId,
            products: {
                create: body.productNames.map((p) => {return { productName: p}})
            },
        },
	});

	return plainToInstance(RecipeView, recipe);
};