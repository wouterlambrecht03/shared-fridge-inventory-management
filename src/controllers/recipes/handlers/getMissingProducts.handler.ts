import { NotFoundException } from "@nestjs/common";
import { prisma } from "../../../lib/prisma";

export const getMissingProducts = async (userId: string, recipeId: string): Promise<string[]>  => {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
          products: {
              select: { productName: true }
          }
      }
    })
    if (!recipe) {
      throw new NotFoundException("Recipe not found");
    }

    const reqProductNames = recipe.products.map((p) => p.productName);

    const availProducts = await prisma.product.findMany({
      where: { userId },
    });

    const availProductNames = availProducts.map((p) => p.name);

    const missingProducts = reqProductNames.filter((p) => !availProductNames.includes(p));

    return missingProducts;
};