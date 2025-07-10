import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID } from "class-validator";

export class ProductsQuery {
	@ApiPropertyOptional()
	@IsUUID()
	@IsOptional()
	public fridgeId?: string;

	@ApiPropertyOptional()
	@IsString()
	@IsOptional()
	public location?: string;
}