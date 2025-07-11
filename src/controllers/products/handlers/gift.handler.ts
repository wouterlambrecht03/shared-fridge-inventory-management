import { plainToInstance } from "class-transformer";
import { prisma } from "../../../lib/prisma";
import { ProductView } from "../../../contracts/product.view";
import { BadRequestException, NotFoundException, UnauthorizedException } from "@nestjs/common";

export const gift = async (productId: string, ownerId: string, recvId: string): Promise<ProductView>  => {
    if (ownerId == recvId) {
        throw new BadRequestException("You can't gift a product to yourself");
    }
    const product = await prisma.product.findUnique({
        where: { id: productId },
    })
    if (!product) {
        throw new NotFoundException("Product not found");
    }
    if (product.userId !== ownerId) {
        throw new UnauthorizedException("You are not the owner of this product");
    }

    const updated = await prisma.product.update({
      where: { id: productId },
	  data: { userId: recvId }
	})

    return plainToInstance(ProductView, updated);
};