import { Exclude, Expose } from "class-transformer";
import { IsArray, IsString, IsUUID } from "class-validator";

@Exclude()
export class RecipeView {
	@Expose()
	@IsUUID()
	id: string;

	@Expose()
	@IsString()
	public name: string;

	@Expose()
	@IsString()
	public description: string;

	@Expose()
	@IsUUID()
	public userId: string;

	// @Expose()
	// @IsArray()
	// @IsUUID("all", { each: true })
	// public productIds: string[];

	@Expose()
	@IsArray()
	@IsString({ each: true })
	public productNames: string[];
}