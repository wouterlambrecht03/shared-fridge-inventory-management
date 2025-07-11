import { expect } from "chai";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcryptjs";
import { getList } from "../../controllers/recipes/handlers/getList.handler";
import { get } from "../../controllers/recipes/handlers/get.handler";
import { RecipeBody } from "../../contracts/recipe.body";
import { create } from "../../controllers/recipes/handlers/create.handler";
import { del } from "../../controllers/recipes/handlers/delete.handler";
import { update } from "../../controllers/recipes/handlers/update.handler";
import { UpdateRecipeBody } from "../../contracts/updateRecipe.body";
import { getMissingProducts } from "../../controllers/recipes/handlers/getMissingProducts.handler";

const userFixtures = [
	{
		firstName: "test1first",
		lastName: "test1last",
		email: "test-user+1@panenco.com",
		password: "password1",
	},
	{
		firstName: "test2first",
		lastName: "test2last",
		email: "test-user+2@panenco.com",
		password: "password2",
	},
];

const fridgeFixtures = [
	{
		location: "floor1",
		capacity: 100000,
	},
	{
		location: "floor2",
		capacity: 50000,
	},
	{
		location: "floor2",
		capacity: 10000,
	},
];

const productFixtures = [
	{
		name: "product1",
		space: 2000,
        fridgeId: "",
        userId: "",
	},
	{
		name: "product2",
		space: 500,
        fridgeId: "",
        userId: "",
	},
];

const recipeFixtures = [
    {
		name: "recipe1",
		description: "recipe1description",
        userId: "",
        productNames: ["product1", "product2", "product3"]
	},
	{
		name: "recipe2",
		description: "recipe2description",
        userId: "",
        productNames: ["product1"]
	},
];

describe("Recipes handler tests", () => {
    let users: any[];
    let fridges: any[];
    let products: any[];
    let recipes: any[];

	beforeEach(async () => {
        const hashedUserFixtures = await Promise.all(
            userFixtures.map(async (u) => {
                const hashedPassword = await bcrypt.hash(u.password, 10);
                u.password = hashedPassword;
                return u;
            })
        );
        await prisma.recipe.deleteMany();
        await prisma.product.deleteMany();
        await prisma.fridge.deleteMany();
        await prisma.user.deleteMany();

        await prisma.user.createMany({
            data: hashedUserFixtures
        });
        users = await prisma.user.findMany();

        await prisma.fridge.createMany({
            data: fridgeFixtures
        });
        fridges = await prisma.fridge.findMany();

        const completedProducts = productFixtures.map((p) => {
            p.fridgeId = fridges[0].id;
            p.userId = users[0].id;
            return p;
        });
        await prisma.product.createMany({
            data: completedProducts,
        });
        products = await prisma.product.findMany();

        const completedRecipes = recipeFixtures.map((r) => {
            return {
                name: r.name,
                description: r.description,
                userId: users[0].id,
                products: {
                    create: r.productNames.map((p) => {return { productName: p}})
                },
            };
        });
        for (const recipe of completedRecipes) await prisma.recipe.create({ data: recipe });
        recipes = await prisma.recipe.findMany();
	});

    it("should get all recipes of a user", async () => {
        const res = await getList(users[0].id);

        expect(res.length).equal(2);
        expect(res.some((x) => x.name === "recipe1")).true;
        expect(res[0].productNames).to.be.an("array");
        expect(res[0].productNames.length).equal(3);
        expect(res.some((x) => x.name === "recipe2")).true;
        expect(res[1].productNames).to.be.a("array");
        expect(res[1].productNames.length).equal(1);
    });

    it("should get a recipe by id", async () => {
        const res = await get(recipes[0].id);

        expect(res.id).equal(recipes[0].id);
        expect(res.productNames).to.be.a("array");
        expect(res.productNames.length).equal(3);
    });

    it("should not get a recipe by unknown id", async () => {
        try {
            await get("999");
        } catch (error) {
            expect(error.message).equal("Recipe not found");
            return;
        }
        expect(true, "should have thrown an error").false;
    });

    it("should create a recipe", async () => {
        const body = {
            name: "recipe3",
            description: "recipe3description",
            userId: users[0].id,
            productNames: ["product2"],
        } as RecipeBody;
        const res = await create(body);

        expect(res.name).equal("recipe3");
        expect(res.description).equal("recipe3description");
        expect(res.userId).equal(users[0].id);
        expect(res.productNames).to.be.a("undefined");
    });

    it("should modify the name of a recipe", async () => {
        const body = {
            name: "recipe1updated",
            // description: "recipe1description",
            // userId: users[0].id,
            // productNames: ["product1", "product2", "product3"],
        } as UpdateRecipeBody;
        const res = await update(recipes[0].id, body);

        expect(res.name).equal("recipe1updated");
        expect(res.description).equal("recipe1description");
        expect(res.userId).equal(users[0].id);
        expect(res.productNames).to.be.a("undefined");
    });

    it("should modify the description of a recipe", async () => {
        const body = {
            // name: "recipe1",
            description: "recipe1descriptionUpdated",
            // userId: users[0].id,
            // productNames: ["product1", "product2", "product3"],
        } as UpdateRecipeBody;
        const res = await update(recipes[0].id, body);

        expect(res.name).equal("recipe1");
        expect(res.description).equal("recipe1descriptionUpdated");
        expect(res.userId).equal(users[0].id);
        expect(res.productNames).to.be.a("undefined");
    });

    it("should modify the products of a recipe", async () => {
        const body = {
            // name: "recipe1",
            // description: "recipe1description",
            // userId: users[0].id,
            productNames: ["product1", "product3", "product4"],
        } as UpdateRecipeBody;
        const res = await update(recipes[0].id, body);

        expect(res.name).equal("recipe1");
        expect(res.description).equal("recipe1description");
        expect(res.userId).equal(users[0].id);
        expect(res.productNames).to.be.a("undefined");

        const recipe = await get(recipes[0].id);
        expect(recipe.productNames).to.be.an("array");
        expect(recipe.productNames.length).equal(3);
        expect(recipe.productNames.some((p) => p == "product1")).true;
    });

    it("should delete a recipe", async () => {
        await del(recipes[0].id)
        
        const updatedRecipeList = await prisma.recipe.findMany();
        expect(updatedRecipeList.length).equal(1);
        expect(updatedRecipeList.some((x) => x.id === products[0].id)).false;
    });

    it("should not be able to delete a recipe by unknown id", async () => {
        try {
            await del("999");
        } catch (error) {
            expect(error.message).equal("Recipe not found");
            return;
        }
        expect(true, "should have thrown an error").false;
    });

    it("should get all missing products for a recipe", async () => {
        const res = await getMissingProducts(users[0].id, recipes[0].id);

        expect(res.length).equal(1);
        expect(res[0]).equal("product3");
    });

    it("should get no missing products for a recipe", async () => {
        const res = await getMissingProducts(users[0].id, recipes[1].id);

        expect(res.length).equal(0);
    });

    it("should not get missing products for a recipe by unknown id", async () => {
        try {
            await getMissingProducts(users[0].id, "999");
        } catch (error) {
            expect(error.message).equal("Recipe not found");
            return;
        }
        expect(true, "should have thrown an error").false;
    });
});
