import { plainToInstance } from "class-transformer";
import { prisma } from "../../../lib/prisma";
import { ProductView } from "../../../contracts/product.view";
import { NotFoundException } from "@nestjs/common";

export const get = async (productId: string): Promise<ProductView>  => {
    const product = await prisma.product.findUnique({
        where: { id: productId },
    })
    if (!product) {
        throw new NotFoundException("Product not found");
    }

    return plainToInstance(ProductView, product);
};