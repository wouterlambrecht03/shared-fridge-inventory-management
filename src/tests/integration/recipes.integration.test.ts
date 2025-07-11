import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { expect } from "chai";
import { before, beforeEach, after, describe, it } from "mocha";
import request from "supertest";

import { AppModule } from "../../app.module";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcryptjs";
import { RecipeView } from "../../contracts/recipe.view";
import { UpdateRecipeBody } from "../../contracts/updateRecipe.body";

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

describe("Integration tests", () => {
	describe("Recipes Tests", () => {
        let app: INestApplication;
        let users: any[];
        let fridges: any[];
        let products: any[];

		before(async () => {
			const moduleFixture: TestingModule = await Test.createTestingModule(
				{
					imports: [AppModule],
				}
			).compile();

			app = moduleFixture.createNestApplication();

			// Apply the same configuration as in main.ts
			app.useGlobalPipes(
				new ValidationPipe({
					whitelist: true,
					forbidNonWhitelisted: true,
					transform: true,
				})
			);

			app.enableCors({
				origin: "*",
				credentials: true,
				exposedHeaders: ["x-auth"],
			});

			app.setGlobalPrefix("api");

            // Connect to database
            await prisma.$connect();
            console.log("Database connected successfully");

			await app.init();
		});

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

            // seed db
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
                data: completedProducts
            });
            products = await prisma.product.findMany();
		});

		after(async () => {
			await app.close();
		});

        it("should crud recipes", async () => {

            const completedRecipes = recipeFixtures.map((p) => {
                p.userId = users[0].id;
                return p;
            });

            // Login to get JWT token
            const { body: loginResponse1 } = await request(app.getHttpServer())
                .post(`/api/auth/login`)
                .send({
                    email: "test-user+1@panenco.com",
                    password: "password1",
                })
                .expect(200);

            const token1 = loginResponse1.token;
            expect(token1).to.be.a("string");

            const { body: loginResponse2 } = await request(app.getHttpServer())
                .post(`/api/auth/login`)
                .send({
                    email: "test-user+2@panenco.com",
                    password: "password2",
                })
                .expect(200);

            const token2 = loginResponse2.token;
            expect(token2).to.be.a("string");


            // create new recipe
            const { body: createResponse } = await request(app.getHttpServer())
                    .post(`/api/recipes`)
                    .send(completedRecipes[0])
                    .set("x-auth", token1)
                    .expect(201);
            
            // Get the newly created recipe
            const { body: getResponse } = await request(app.getHttpServer())
                .get(`/api/recipes/${createResponse.id}`)
        		.set("x-auth", token1)
                .expect(200);
            expect(getResponse.name).equal("recipe1");

            // create new recipe
            await request(app.getHttpServer())
                    .post(`/api/recipes`)
                    .send(completedRecipes[1])
                    .set("x-auth", token1)
                    .expect(201);

            // Get all recipes
            const { body: getAllResponse } = await request(app.getHttpServer())
                .get(`/api/recipes`)
        		.set("x-auth", token1)
                .expect(200);

            expect(getAllResponse.length).equal(2);
            expect(getAllResponse.some((x: RecipeView) => x.name === completedRecipes[0].name));
            expect(getAllResponse.some((x: RecipeView) => x.name === completedRecipes[1].name));
            expect(getAllResponse.every((x: RecipeView) => x.userId === users[0].id));

            // Successfully modify a recipe
            const { body: updateResponse } = await request(app.getHttpServer())
                .patch(`/api/recipes/${createResponse.id}`)
        		.set("x-auth", token1)
                .send({
                    name: "recipe1updated"
                } as UpdateRecipeBody)
                .expect(200);

            expect(updateResponse.name).equal("recipe1updated");
            expect(updateResponse.description).equal("recipe1description");
            expect(updateResponse.userId).equal(users[0].id);
            expect(updateResponse.productNames).to.be.a("undefined");

            // Get missing ingredients for a recipe
            const { body: getMissingResponse } = await request(app.getHttpServer())
                .get(`/api/recipes/${createResponse.id}/missing`)
        		.set("x-auth", token1)
                .expect(200);

            expect(getMissingResponse.length).equal(1);
            expect(getMissingResponse[0]).equal("product3");

            // Delete a recipe by id
            await request(app.getHttpServer())
                .delete(`/api/recipes/${createResponse.id}`)
        		.set("x-auth", token1)
                .expect(204);

            const { body: getAllResponse5 } = await request(app.getHttpServer())
                .get(`/api/recipes`)
        		.set("x-auth", token1)
                .expect(200);

            expect(getAllResponse5.length).equal(1);
            expect(getAllResponse5[0].id).not.equal(createResponse.id);
        });
    });
});
