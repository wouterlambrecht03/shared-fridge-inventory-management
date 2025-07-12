import { prisma } from "../../../lib/prisma";
import { NotFoundException, UnauthorizedException } from "@nestjs/common";

export const del = async (userId: string, productId: string) => {
    const product = await prisma.product.findUnique({
        where: { id: productId },
    })
    if (!product) {
        throw new NotFoundException("Product not found");
    }
    if (product.userId !== userId) {
        throw new UnauthorizedException("You are not the owner of this product");
    }

    await prisma.product.delete({
      where: { id: productId },
	})
};