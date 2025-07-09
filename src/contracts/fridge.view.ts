import { Exclude, Expose } from "class-transformer";
import { IsInt, IsString, IsUUID } from "class-validator";

@Exclude()
export class FridgeView {
	@Expose()
	@IsUUID()
	id: string;

	@Expose()
	@IsString()
	location: string;

	@Expose()
	@IsInt()
	lastName: number;
}