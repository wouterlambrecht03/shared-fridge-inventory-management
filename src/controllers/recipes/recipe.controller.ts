import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../guards/jwt-auth.guard";
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { RecipeBody } from "../../contracts/recipe.body";
import { RecipeView } from "../../contracts/recipe.view";
import { create } from "./handlers/create.handler";
import { del } from "./handlers/delete.handler";
import { UpdateRecipeBody } from "../../contracts/updateRecipe.body";
import { update } from "./handlers/update.handler";
import { getList } from "./handlers/getList.handler";
import { get } from "./handlers/get.handler";
import { getMissingProducts } from "./handlers/getMissingProducts.handler";
import { getRecipeSuggestions } from "./handlers/getRecipeSuggestions.handler";
import { RecipeSuggestion } from "../../contracts/recipeSuggestion.view";

@ApiTags("recipes")
@Controller("recipes")
export class RecipeController {
    @Post()
	@UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
    @HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: "Create a new recipe" })
	@ApiResponse({ status: 201, description: "Recipe created successfully" })
	async create(@Req() req: Request, @Body() body: RecipeBody): Promise<RecipeView> {
		const userId = req["user"]?.userId;
		return create(userId, body);
	}

    @Delete(":id")
	@UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
	@ApiSecurity("x-auth")
	@ApiOperation({ summary: "Delete a recipe by its id" })
	@ApiResponse({ status: 204, description: "Recipe deleted successfully" })
	async delete(@Req() req: Request, @Param("id") id: string) {
		const userId = req["user"]?.userId;
		await del(userId, id);
	}

    @Patch(":id")
	@UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
	@ApiOperation({ summary: "Update a recipe by its id" })
	@ApiResponse({ status: 200, description: "Recipe updated successfully" })
	async update(@Req() req: Request, @Body() body: UpdateRecipeBody, @Param("id") id: string): Promise<RecipeView>  {
		const userId = req["user"]?.userId;
		return update(userId, id, body);
	}

	@Get()
	@UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
	@ApiOperation({ summary: "Get all recipes of a user" })
	@ApiResponse({ status: 200, description: "Recipes retrieved successfully" })
	async getList(@Req() req: Request): Promise<RecipeView[]>  {
		const userId = req["user"]?.userId;
		return getList(userId);
	}

	@Get(":id")
	@UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
	@ApiOperation({ summary: "Get a recipe by its id" })
	@ApiResponse({ status: 200, description: "Recipe retrieved successfully" })
	async get(@Param("id") id: string): Promise<RecipeView>  {
		return get(id);
	}

    @Get(":id/missing")
	@UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
	@ApiOperation({ summary: "Get all missing ingredients for a recipe" })
	@ApiResponse({ status: 200, description: "Products retrieved successfully" })
	async getMissingProductList(@Req() req: Request, @Param("id") id: string): Promise<string[]>  {
		const userId = req["user"]?.userId;
		return getMissingProducts(userId, id);
	}

	@Get(":id/suggestions")
	@UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
	@ApiOperation({ summary: "Get recipe suggestions based on available ingredients" })
	@ApiResponse({ status: 200, description: "Recipes generated successfully" })
	async getRecipeSuggestions(@Req() req: Request): Promise<RecipeSuggestion[]>  {
		const userId = req["user"]?.userId;
		return getRecipeSuggestions(userId);
	}
}