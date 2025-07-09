import { prisma } from "../../../lib/prisma";
import { UserView } from "../../../contracts/user.view";
import { plainToInstance } from "class-transformer";

export const getList = async (search: string | null): Promise<UserView[]>  => {
    let users;
    if (search) {
        users = await prisma.user.findMany({
            where: {
                OR: [
                    {name: { contains: search, mode: "insensitive" as const}},
                    {email: { contains: search, mode: "insensitive" as const}},
                ]
            }
        });
    } else {
        users = await prisma.user.findMany()
    }
    return users.map((u) => plainToInstance(UserView, u));
};