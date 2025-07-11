import { Exclude, Expose } from "class-transformer";
import { IsArray, IsOptional, IsString, IsUUID } from "class-validator";

@Exclude()
export class UpdateRecipeBody {
	@Expose()
	@IsString()
	@IsOptional()
	public name: string;

	@Expose()
	@IsString()
	@IsOptional()
	public description: string;

	@Expose()
	@IsUUID()
	@IsOptional()
	public userId: string;

	// @Expose()
	// @IsUUID()
	// @IsOptional()
	// public productIds: string[];

	@Expose()
	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	public productNames: string[];
}