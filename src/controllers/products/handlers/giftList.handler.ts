import { prisma } from "../../../lib/prisma";
import { BadRequestException } from "@nestjs/common";

export const giftList = async (userId: string, recvId: string, fridgeId?: string, location?: string) => {
    if (fridgeId && location) {
        throw new BadRequestException("It is not allowed to specify both a fridge id and a location");
    }

    let where: { userId: string; fridgeId?: string; fridge?: {location: string}; } = { userId: userId };
    if (fridgeId) {
        where.fridgeId = fridgeId;
    } else if (location) {
        where.fridge = { location: location };
    }
    await prisma.product.updateMany({
        where: where,
        data: { userId: recvId }
    });
};