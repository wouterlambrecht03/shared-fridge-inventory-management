import { expect } from "chai";
import { getList } from "../../controllers/users/handlers/getList.handler";
import { getUser } from "../../controllers/users/handlers/get.handler";
import { create } from "../../controllers/users/handlers/create.handler";
import { del } from "../../controllers/users/handlers/delete.handler";
import { update } from "../../controllers/users/handlers/update.handler";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcryptjs";
import { UserBody } from "../../contracts/user.body";

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

describe("Users handler tests", () => {
    let users: any[];

	beforeEach(async () => {
        const hashedUserFixtures = await Promise.all(
            userFixtures.map(async (u) => {
                const hashedPassword = await bcrypt.hash(u.password, 10);
                u.password = hashedPassword;
                return u;
            })
        );
        
        await prisma.product.deleteMany();
        await prisma.fridge.deleteMany();
        await prisma.user.deleteMany();

        await prisma.user.createMany({
            data: hashedUserFixtures
        })
        users = await prisma.user.findMany();
	});

    it("should get users", async () => {
        const res = await getList(null);

        expect(res.length).equal(2);
        expect(res.some((x) => x.firstName === "test1first")).true;
        expect(res.some((x) => x.firstName === "test2first")).true;
    });

    it("should search users", async () => {
        const res = await getList("test1");

        expect(res.length).equal(1);
        expect(res.some((x) => x.firstName === "test1first")).true;
    });

    it("should get user by id", async () => {
        const res = await getUser(users[0].id);

        expect(res.id).equal(users[0].id);
    });

    it("should not get user by unknown id", async () => {
        try {
            await getUser("999");
        } catch (error) {
            expect(error.message).equal("User not found");
            return;
        }
        expect(true, "should have thrown an error").false;
    });

    it("should create user", async () => {
        const body = {
            email: "test-user+3@panenco.com",
            firstName: "test3first",
            lastName: "test3last",
            password: "password3",
        } as UserBody;
        const res = await create(body);

        expect(res.firstName).equal("test3first");
        expect(res.lastName).equal("test3last");
        expect(res.email).equal("test-user+3@panenco.com");
        // expect(res.password).undefined; // TODO
    });

    it("should update user", async () => {
        const body = { firstName: "updated"} as UserBody;
        const res = await update(users[0].id, body);
        expect(res.firstName).equal("updated");
    });

    it("should delete user", async () => {
        await del(users[0].id)
        
        // expect(UserStore.users.length).equal(1);
        // expect(UserStore.users.some((x) => x.id === 0)).false;
        const updatedUserList = await prisma.user.findMany();
        expect(updatedUserList.length).equal(1);
        expect(updatedUserList.some((x) => x.id === users[0].id)).false;
    })
});
