import { Exclude, Expose } from "class-transformer";
import { IsInt, IsString } from "class-validator";

@Exclude()
export class FridgeBody {
	@Expose()
	@IsString()
	public location: string;

	@Expose()
	@IsInt()
	public capacity: number;
}