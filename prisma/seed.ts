import { prisma } from "../src/lib/prisma";

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

async function main() {
    await prisma.recipe.deleteMany();
    await prisma.product.deleteMany();
    await prisma.fridge.deleteMany();
    await prisma.user.deleteMany();

    await prisma.fridge.createMany({
        data: fridgeFixtures
    });
    const fridges = await prisma.fridge.findMany();
    console.log(fridges);
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })