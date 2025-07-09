import { Exclude, Expose } from "class-transformer";
import { IsEmail, IsString, IsUUID } from "class-validator";

@Exclude()
export class UserView {
	@Expose()
	@IsUUID()
	id: string;

	@Expose()
	@IsString()
	firstName: string;

	@Expose()
	@IsString()
	lastName: string;

	@Expose()
	@IsEmail()
	email: string;

	// password is automatically excluded because it's not @Expose()d
}