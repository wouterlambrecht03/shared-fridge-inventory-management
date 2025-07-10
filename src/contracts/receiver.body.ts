import { Exclude, Expose } from "class-transformer";
import { IsString } from "class-validator";

@Exclude()
export class ReceiverBody {
	@Expose()
	@IsString()
	public receiverId: string;
}