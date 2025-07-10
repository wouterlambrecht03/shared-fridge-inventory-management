import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../guards/jwt-auth.guard";
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { ProductBody } from "../../contracts/product.body";
import { ProductView } from "../../contracts/product.view";
import { ProductsQuery } from "../../contracts/products.query";
import { create } from "./handlers/create.handler";
import { gift } from "./handlers/gift.handler";
import { del } from "./handlers/delete.handler";
import { get } from "./handlers/get.handler";
import { getList } from "./handlers/getList.handler";
import { deleteList } from "./handlers/deleteList.handler";
import { giftList } from "./handlers/giftList.handler";
import { ReceiverBody } from "../../contracts/receiver.body";

@ApiTags("products")
@Controller("products")
export class ProductController {

	@Post()
    @UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
    @HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: "Put a product in a fridge" })
	@ApiResponse({ status: 201, description: "Product added successfully" })
	async createProduct(@Body() body: ProductBody): Promise<ProductView> {
        return create(body);
	}

    @Patch(":id")
	@UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
	@ApiOperation({ summary: "Gift a product to another user" })
	@ApiResponse({ status: 200, description: "Product gifted successfully" })
	async giftProduct(@Body() recv: ReceiverBody, @Param("id") id: string): Promise<ProductView>  {
		return gift(id, recv.receiverId);
	}

	@Delete(":id")
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiSecurity("x-auth")
	@ApiOperation({ summary: "Delete a product from a fridge" })
	@ApiResponse({ status: 204, description: "Product deleted successfully" })
	async deleteProduct(@Param("id") id: string) {
		await del(id);
	}

	@Get(":id")
	@UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
	@ApiOperation({ summary: "Get a product by its id" })
	@ApiResponse({ status: 200, description: "Product retrieved successfully" })
	async getProduct(@Param("id") id: string): Promise<ProductView>  {
		return get(id);
	}

	@Get()
	@UseGuards(JwtAuthGuard)
	@ApiSecurity("x-auth")
	@ApiOperation({ summary: "Get products (all or from a fridge or from a location)" })
	@ApiResponse({ status: 200, description: "Products retrieved successfully" })
	async getProductList(@Req() req: Request, @Query() query: ProductsQuery): Promise<ProductView[]>  {
		const userId = req["user"]?.userId;
		return getList(userId, query.fridgeId, query.location);
	}

	@Patch()
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiSecurity("x-auth")
	@ApiOperation({ summary: "Gift products (all or from a fridge or from a location)" })
	@ApiResponse({ status: 204, description: "Products gifted successfully" })
	async giftProductList(@Req() req: Request, @Body() recv: ReceiverBody, @Query() query: ProductsQuery) {
		const userId = req["user"]?.userId;
		await giftList(userId, recv.receiverId, query.fridgeId, query.location);
	}

	@Delete()
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiSecurity("x-auth")
	@ApiOperation({ summary: "Delete products (all or from a fridge or from a location)" })
	@ApiResponse({ status: 204, description: "Products deleted successfully" })
	async deleteProductList(@Req() req: Request, @Query() query: ProductsQuery) {
		const userId = req["user"]?.userId;
		await deleteList(userId, query.fridgeId, query.location);
	}
}