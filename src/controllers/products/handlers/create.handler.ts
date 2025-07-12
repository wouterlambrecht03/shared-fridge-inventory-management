import { plainToInstance } from "class-transformer";
import { prisma } from "../../../lib/prisma";
import { ProductBody } from "../../../contracts/product.body";
import { ProductView } from "../../../contracts/product.view";
import { BadRequestException, NotFoundException } from "@nestjs/common";

export const create = async (userId: string, body: ProductBody): Promise<ProductView>  => {
    // TODO: transaction?
    const fridge = await prisma.fridge.findUnique({
        where: { id: body.fridgeId },
    })
    if (!fridge) {
        throw new NotFoundException("Fridge not found");
    }

    const result = await prisma.product.aggregate({
        where: { fridgeId: body.fridgeId },
        _sum: { space: true },
    })
    const spaceUsed = result._sum.space ?? 0;
    if (spaceUsed + body.space > fridge.capacity) {
        throw new BadRequestException("Fridge has not enough capacity");
    }

	const product = await prisma.product.create({
		data: {...body, userId}
	});

	return plainToInstance(ProductView, product);
};