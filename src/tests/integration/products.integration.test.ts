import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { expect } from "chai";
import { before, beforeEach, after, describe, it } from "mocha";
import request from "supertest";

import { AppModule } from "../../app.module";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcryptjs";
import { ReceiverBody } from "../../contracts/receiver.body";
import { ProductView } from "../../contracts/product.view";

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

describe("Integration tests", () => {
	describe("Product Tests", () => {
        let app: INestApplication;
        let users: any[];
        let fridges: any[];

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
		});

		after(async () => {
			await app.close();
		});

        it("should crud products", async () => {

            const completedProducts = productFixtures.map((p) => {
                p.fridgeId = fridges[0].id;
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


            // create new product
            const { body: createResponse } = await request(app.getHttpServer())
                    .post(`/api/products`)
                    .send(completedProducts[0])
                    .set("x-auth", token1)
                    .expect(201);
            
            // Get the newly created product
            const { body: getResponse } = await request(app.getHttpServer())
                .get(`/api/products/${createResponse.id}`)
        		.set("x-auth", token1)
                .expect(200);
            expect(getResponse.name).equal("product1");

            // create new product
            completedProducts[1].fridgeId = fridges[1].id;
            await request(app.getHttpServer())
                    .post(`/api/products`)
                    .send(completedProducts[1])
                    .set("x-auth", token1)
                    .expect(201);

            // Get all products
            const { body: getAllResponse } = await request(app.getHttpServer())
                .get(`/api/products`)
        		.set("x-auth", token1)
                .expect(200);

            expect(getAllResponse.length).equal(2);
            expect(getAllResponse.some((x: ProductView) => x.name === completedProducts[0].name));
            expect(getAllResponse.some((x: ProductView) => x.name === completedProducts[1].name));
            expect(getAllResponse.every((x: ProductView) => x.userId === users[0].id));

            // Get products from a fridge
            const { body: getAllResponse01 } = await request(app.getHttpServer())
                .get(`/api/products?fridgeId=${fridges[0].id}`)
        		.set("x-auth", token1)
                .expect(200);

            expect(getAllResponse01.length).equal(1);
            expect(getAllResponse01[0].fridgeId).equal(fridges[0].id);

            // Get products from a location
            const { body: getAllResponse02 } = await request(app.getHttpServer())
                .get(`/api/products?location=${fridges[0].location}`)
        		.set("x-auth", token1)
                .expect(200);

            expect(getAllResponse02.length).equal(1);
            expect(getAllResponse02[0].fridgeId).equal(fridges[0].id);

            // Gift all products
            await request(app.getHttpServer())
                .patch(`/api/products`)
        		.set("x-auth", token1)
                .send({
                    receiverId: users[1].id
                } as ReceiverBody)
                .expect(204);

            const { body: getAllResponse2 } = await request(app.getHttpServer())
                .get(`/api/products`)
        		.set("x-auth", token2)
                .expect(200);

            expect(getAllResponse2.length).equal(2);
            expect(getAllResponse2.some((x: ProductView) => x.name === completedProducts[0].name));
            expect(getAllResponse2.some((x: ProductView) => x.name === completedProducts[1].name));
            expect(getAllResponse2.every((x: ProductView) => x.userId === users[1].id));

            // Gift all products from a fridge
            await request(app.getHttpServer())
                .patch(`/api/products?fridgeId=${fridges[0].id}`)
        		.set("x-auth", token2)
                .send({
                    receiverId: users[0].id
                } as ReceiverBody)
                .expect(204);

            const { body: getAllResponse3 } = await request(app.getHttpServer())
                .get(`/api/products`)
        		.set("x-auth", token1)
                .expect(200);

            expect(getAllResponse3.length).equal(1);
            expect(getAllResponse3[0].fridgeId).equal(fridges[0].id);

            // Gift all products from a location
            await request(app.getHttpServer())
                .patch(`/api/products?location=${fridges[0].location}`)
        		.set("x-auth", token1)
                .send({
                    receiverId: users[1].id
                } as ReceiverBody)
                .expect(204);

            const { body: getAllResponse4 } = await request(app.getHttpServer())
                .get(`/api/products`)
        		.set("x-auth", token2)
                .expect(200);

            expect(getAllResponse4.length).equal(2);
            expect(getAllResponse4.some((x: ProductView) => x.name === completedProducts[0].name));
            expect(getAllResponse4.some((x: ProductView) => x.name === completedProducts[1].name));
            expect(getAllResponse4.every((x: ProductView) => x.userId === users[1].id));

            // Successfully gift a product to another user
            const { body: updateResponse } = await request(app.getHttpServer())
                .patch(`/api/products/${createResponse.id}`)
        		.set("x-auth", token2)
                .send({
                    receiverId: users[0].id
                } as ReceiverBody)
                .expect(200);

            expect(updateResponse.name).equal("product1");
            expect(updateResponse.space).equal(2000);
            expect(updateResponse.userId).equal(users[0].id);
            expect(updateResponse.fridgeId).equal(fridges[0].id);
            expect(updateResponse.id).equal(createResponse.id);

            await request(app.getHttpServer())
                .patch(`/api/products`)
        		.set("x-auth", token2)
                .send({
                    receiverId: users[0].id
                } as ReceiverBody)
                .expect(204);

            // Delete a product by id
            await request(app.getHttpServer())
                .delete(`/api/products/${createResponse.id}`)
        		.set("x-auth", token1)
                .expect(204);

            const { body: getAllResponse5 } = await request(app.getHttpServer())
                .get(`/api/products`)
        		.set("x-auth", token1)
                .expect(200);

            expect(getAllResponse5.length).equal(1);
            expect(getAllResponse5[0].id).not.equal(createResponse.id);

            await request(app.getHttpServer())
                    .post(`/api/products`)
                    .send(completedProducts[0])
                    .set("x-auth", token1)
                    .expect(201);

            // Delete products by fridgeId
            await request(app.getHttpServer())
                .delete(`/api/products?fridgeId=${fridges[0].id}`)
        		.set("x-auth", token1)
                .expect(204);

            const { body: getAllResponse6 } = await request(app.getHttpServer())
                .get(`/api/products`)
        		.set("x-auth", token1)
                .expect(200);

            expect(getAllResponse6.length).equal(1);
            expect(getAllResponse5[0].id).not.equal(createResponse.id);
            expect(getAllResponse5[0].id).not.equal(fridges[0].id);

            await request(app.getHttpServer())
                    .post(`/api/products`)
                    .send(completedProducts[0])
                    .set("x-auth", token1)
                    .expect(201);

            // Delete all products
            await request(app.getHttpServer())
                .delete(`/api/products`)
        		.set("x-auth", token1)
                .expect(204);

            const { body: getAllResponse7 } = await request(app.getHttpServer())
                .get(`/api/products`)
        		.set("x-auth", token1)
                .expect(200);

            expect(getAllResponse7.length).equal(0);

        });

    });
});
