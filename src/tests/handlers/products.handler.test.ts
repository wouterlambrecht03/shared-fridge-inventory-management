import { expect } from "chai";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcryptjs";
import { getList } from "../../controllers/products/handlers/getList.handler";
import { get } from "../../controllers/products/handlers/get.handler";
import { ProductBody } from "../../contracts/product.body";
import { create } from "../../controllers/products/handlers/create.handler";
import { gift } from "../../controllers/products/handlers/gift.handler";
import { del } from "../../controllers/products/handlers/delete.handler";
import { deleteList } from "../../controllers/products/handlers/deleteList.handler";
import { giftList } from "../../controllers/products/handlers/giftList.handler";

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

describe("Products handler tests", () => {
    let users: any[];
    let fridges: any[];
    let products: any[];

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
        // console.log(products);
	});

    it("should get all products of a user", async () => {
        const res = await getList(users[0].id);

        expect(res.length).equal(2);
        expect(res.some((x) => x.name === "product1")).true;
        expect(res.some((x) => x.name === "product1")).true;
    });

    it("should get products in a fridge of a user", async () => {
        const res = await getList(users[0].id, fridges[0].id);

        expect(res.length).equal(2);
        expect(res.some((x) => x.name === "product1")).true;
        expect(res.some((x) => x.name === "product1")).true;
    });

    it("should get no products in a fridge of a user", async () => {
        const res = await getList(users[0].id, fridges[1].id);

        expect(res.length).equal(0);
    });

    it("should get products in a location of a user", async () => {
        const res = await getList(users[0].id, undefined, fridges[0].location);

        expect(res.length).equal(2);
        expect(res.some((x) => x.name === "product1")).true;
        expect(res.some((x) => x.name === "product1")).true;
    });

    it("should get no products in a location of a user", async () => {
        const res = await getList(users[0].id, undefined, fridges[1].location);

        expect(res.length).equal(0);
    });

    it("should get a product by id", async () => {
        const res = await get(products[0].id);

        expect(res.id).equal(products[0].id);
    });

    it("should not get product by unknown id", async () => {
        try {
            await get("999");
        } catch (error) {
            expect(error.message).equal("Product not found");
            return;
        }
        expect(true, "should have thrown an error").false;
    });

    it("should create a product", async () => {
        const body = {
            name: "product3",
            space: 1000,
            userId: users[0].id,
            fridgeId: fridges[0].id
        } as ProductBody;
        const res = await create(body);

        expect(res.name).equal("product3");
        expect(res.space).equal(1000);
        expect(res.userId).equal(users[0].id);
        expect(res.fridgeId).equal(fridges[0].id);
    });

    it("should not create a product when the fridge is almost full", async () => {
        const body = {
            name: "product3",
            space: 100000 - 2000 - 500 + 1,
            userId: users[0].id,
            fridgeId: fridges[0].id
        } as ProductBody;
        try {
            await create(body);
        } catch (error) {
            expect(error.message).equal("Fridge has not enough capacity");
            return;
        }
        expect(true, "should have thrown an error").false;
    });

    it("should gift a product to another user", async () => {
        const res = await gift(products[0].id, users[1].id);
        expect(res.userId).equal(users[1].id); // TODO: check if gift to yourself?
    });

    it("should gift all products of a user to another user", async () => {
        const res = await giftList(users[0].id, users[1].id);
        
        const updatedProductList = await prisma.product.findMany();
        expect(updatedProductList.length).equal(2);
        expect(updatedProductList.some((x) => x.userId === users[0].id)).false;
        expect(updatedProductList.every((x) => x.userId === users[1].id)).true;
    });

    it("should gift products of a user in a fridge to another user", async () => {
        const res = await giftList(users[0].id, users[1].id, fridges[0].id);
        
        const updatedProductList = await prisma.product.findMany();
        expect(updatedProductList.length).equal(2);
        expect(updatedProductList.some((x) => x.userId === users[0].id)).false;
        expect(updatedProductList.every((x) => x.userId === users[1].id)).true;
    });

    it("should delete a product", async () => {
        await del(products[0].id)
        
        const updatedProductList = await prisma.product.findMany();
        expect(updatedProductList.length).equal(1);
        expect(updatedProductList.some((x) => x.id === products[0].id)).false;
    });

    it("should delete all products of a user from all fridges", async () => {
        await deleteList(users[0].id)
        
        const updatedProductList = await prisma.product.findMany();
        expect(updatedProductList.length).equal(0);
    });

    it("should delete all products of a user from a fridge", async () => {
        await deleteList(users[0].id, fridges[0].id)
        
        const updatedProductList = await prisma.product.findMany();
        expect(updatedProductList.length).equal(0);
    });
});
