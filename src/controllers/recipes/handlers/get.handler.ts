import { NotFoundException } from "@nestjs/common";
import { prisma } from "../../../lib/prisma";
import { plainToInstance } from "class-transformer";
import { RecipeView } from "../../../contracts/recipe.view";

export const get = async (idString: string): Promise<RecipeView>  => {
    const recipe = await prisma.recipe.findUnique({
      where: { id: idString },
      include: {
          products: {
              select: { productName: true }
          }
      }
    })
    if (!recipe) {
      throw new NotFoundException("Recipe not found");
    }
    const recipeView = plainToInstance(RecipeView, recipe);
    recipeView.productNames = recipe.products.map((p) => p.productName);
    return recipeView;
};