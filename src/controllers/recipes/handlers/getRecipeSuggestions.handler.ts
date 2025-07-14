import { prisma } from "../../../lib/prisma";
import { RecipeSuggestion } from "../../../contracts/recipeSuggestion.view";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateObject } from 'ai';
import { z } from 'zod';
import { plainToInstance } from "class-transformer";

export const getRecipeSuggestions = async (userId: string): Promise<RecipeSuggestion[]>  => {
    const anthropic = createAnthropic();

    const products = await prisma.product.findMany({
        where: { userId: userId },
        select: { name: true },
    });
    const productNames = products.map((p) => p.name);

    const schema = z.object({
      recipes: z.array(
        z.object({
          name: z.string(),
          description: z.string(),
          ingredients: z.array(z.string()),
        }),
      ),
    });

    const { object } = await generateObject({
        model: anthropic('claude-3-haiku-20240307'),
        schema,
        prompt: 'Generate multiple different recipes that can use some of the following products: ' + productNames,
    });

    return object.recipes.map((r) => {
        const recipeView = plainToInstance(RecipeSuggestion, r);
        recipeView.productNames = r.ingredients;
        return recipeView;
    });
};