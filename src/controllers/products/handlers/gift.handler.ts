import { plainToInstance } from "class-transformer";
import { prisma } from "../../../lib/prisma";
import { ProductView } from "../../../contracts/product.view";
import { NotFoundException } from "@nestjs/common";

export const gift = async (productId: string, recvId: string): Promise<ProductView>  => {
    const product = await prisma.product.findUnique({
        where: { id: productId },
    })
    if (!product) {
        throw new NotFoundException("Product not found");
    }

    const updated = await prisma.product.update({
      where: { id: productId },
	  data: { userId: recvId }
	})

    return plainToInstance(ProductView, updated);
};