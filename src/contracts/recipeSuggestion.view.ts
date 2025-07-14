import { Exclude, Expose } from "class-transformer";
import { IsArray, IsString } from "class-validator";

@Exclude()
export class RecipeSuggestion {
	@Expose()
	@IsString()
	public name: string;

	@Expose()
	@IsString()
	public description: string;

	@Expose()
	@IsArray()
	@IsString({ each: true })
	public productNames: string[];
}