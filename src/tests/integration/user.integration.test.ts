import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { expect } from "chai";
import { before, beforeEach, after, describe, it } from "mocha";
import request from "supertest";

import { AppModule } from "../../app.module";
import { prisma } from "../../lib/prisma";
import { UserBody } from "../../contracts/user.body";
import { UpdateUserBody } from "../../contracts/updateUser.body";

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

describe("Integration tests", () => {
	describe("User Tests", () => {
        let app: INestApplication;

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
            await prisma.recipe.deleteMany();
            await prisma.product.deleteMany();
            await prisma.fridge.deleteMany();
            await prisma.user.deleteMany();
		});

		after(async () => {
			await app.close();
		});

        // Create a new user
        // Get the newly created user by id
        // Update the user
        // Search for the newly created user with the result of the get call
        // Validate the response contains the newly created user with the updated details
        // Delete the user
        // Get all users again and validate the user is not in the list anymore

        it("should crud users", async () => {
            // unauthorized
            // await request.post(`/api/users`).expect(401);

            // create new user
            const { body: createResponse } = await request(app.getHttpServer())
                    .post(`/api/users`)
                    .send(userFixtures[0])
                    .expect(201);
            
            // expect(UserStore.users.some((x) => x.email === createResponse.email)).true;

            // Login to get JWT token
            const { body: loginResponse } = await request(app.getHttpServer())
                .post(`/api/auth/login`)
                .send({
                    email: "test-user+1@panenco.com",
                    password: "password1",
                })
                .expect(200);

            const token = loginResponse.token;
            expect(token).to.be.a("string");

            // Get the newly created user
            const { body: getResponse } = await request(app.getHttpServer())
                .get(`/api/users/${createResponse.id}`)
        		.set("x-auth", token)
                .expect(200);
            expect(getResponse.firstName).equal("test1first");

            // Successfully update user
            const { body: updateResponse } = await request(app.getHttpServer())
                .patch(`/api/users/${createResponse.id}`)
        		.set("x-auth", token)
                .send({
                    email: "test-user+updated@panenco.com",
                } as UpdateUserBody)
                .expect(200);

            expect(updateResponse.firstName).equal("test1first");
            expect(updateResponse.lastName).equal("test1last");
            expect(updateResponse.email).equal("test-user+updated@panenco.com");
            expect(updateResponse.password).undefined; // middleware transformed the object to not include the password

            // Get all users
            const { body: getAllResponse } = await request(app.getHttpServer())
                .get(`/api/users`)
        		.set("x-auth", token)
                .expect(200);

            const newUser = getAllResponse.find(
                (x: UserBody) => x.firstName === getResponse.firstName
            );
            expect(newUser).not.undefined;
            expect(newUser.email).equal("test-user+updated@panenco.com");

            // Delete the newly created user
            await request(app.getHttpServer())
                .delete(`/api/users/${createResponse.id}`)
        		.set("x-auth", token)
                .expect(204);

            // Get all users again after deleted the only user
            const { body: getNoneResponse } = await request(app.getHttpServer())
                .get(`/api/users`)
        		.set("x-auth", token)
                .expect(200);
            expect(getNoneResponse.length).equal(0);
        });

    });
});
