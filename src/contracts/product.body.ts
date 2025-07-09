import { Exclude, Expose } from "class-transformer";
import { IsInt, IsString, IsUUID } from "class-validator";

@Exclude()
export class ProductBody {
	@Expose()
	@IsString()
	public name: string;

	@Expose()
	@IsInt()
	public space: number;

	@Expose()
	@IsUUID()
	public userId: string;

	@Expose()
	@IsUUID()
	public fridgeId: string;
}