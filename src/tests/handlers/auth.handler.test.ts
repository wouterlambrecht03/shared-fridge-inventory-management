import { expect } from "chai";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcryptjs";
import { login } from "../../controllers/auth/handlers/login.handler";
import { LoginBody } from "../../contracts/login.body";
import * as jwt from "jsonwebtoken";
import config from "../../config.json";

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

describe("Auth handler tests", () => {
    let users: any[];

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
        })
        users = await prisma.user.findMany();
	});

    it("should login a user", async () => {
        const body: LoginBody = {
            email: "test-user+1@panenco.com",
            password: "password1",
        }
        const res = await login(body);

        expect(res.expiresIn).equal(3600);
        const token = res.token;
        expect(token).to.be.a("string");
        const payload = jwt.verify(token, config.jwtSecret) as any;
        expect(payload.userId).equal(users[0].id)
    });

    it("should not login an unknown user", async () => {
        const body: LoginBody = {
            email: "unknown@panenco.com",
            password: "password1",
        }
        try {
            await login(body);
        } catch (error) {
            expect(error.message).equal("Invalid credentials");
            return;
        }
        expect(true, "should have thrown an error").false;
    });

    it("should not login a user with incorrect password", async () => {
        const body: LoginBody = {
            email: "test-user+1@panenco.com",
            password: "invalid",
        }
        try {
            await login(body);
        } catch (error) {
            expect(error.message).equal("Invalid credentials");
            return;
        }
        expect(true, "should have thrown an error").false;
    });
});
