import { prisma } from "../../../lib/prisma";
import { plainToInstance } from "class-transformer";
import { ProductView } from "../../../contracts/product.view";
import { BadRequestException } from "@nestjs/common";

export const getList = async (userId: string, fridgeId?: string, location?: string): Promise<ProductView[]>  => {
    if (fridgeId && location) {
        throw new BadRequestException("It is not allowed to specify both a fridge id and a location");
    }

    let where: { userId: string; fridgeId?: string; fridge?: {location: string}; } = { userId: userId };
    if (fridgeId) {
        where.fridgeId = fridgeId;
    } else if (location) {
        where.fridge = { location: location };
    }
   const products = await prisma.product.findMany({
        where: where
    });

    return products.map((p) => plainToInstance(ProductView, p));
};