import { prisma } from "../../../lib/prisma";
import { NotFoundException } from "@nestjs/common";

export const del = async (productId: string) => {
    const product = await prisma.product.findUnique({
        where: { id: productId },
    })
    if (!product) {
        throw new NotFoundException("Product not found");
    }

    await prisma.product.delete({
      where: { id: productId },
	})
};