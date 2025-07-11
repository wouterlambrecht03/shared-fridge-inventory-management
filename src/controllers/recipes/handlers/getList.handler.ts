import { prisma } from "../../../lib/prisma";
import { plainToInstance } from "class-transformer";
import { RecipeView } from "../../../contracts/recipe.view";

export const getList = async (userId: string): Promise<RecipeView[]>  => {
    const recipes = await prisma.recipe.findMany({
        where: { userId: userId },
        include: {
            products: {
                select: { productName: true }
            }
        }
    });
    return recipes.map((r) => {
        const recipeView = plainToInstance(RecipeView, r);
        recipeView.productNames = r.products.map((p) => p.productName);
        return recipeView;
    });
};