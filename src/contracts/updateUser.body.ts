import { Exclude, Expose } from "class-transformer";
import { IsEmail, IsOptional, IsString, Length } from "class-validator";

@Exclude()
export class UpdateUserBody {
	@Expose()
	@IsString()
	@IsOptional()
	public firstName: string;

	@Expose()
	@IsString()
	@IsOptional()
	public lastName: string;

	@Expose()
	@IsEmail()
	@IsOptional()
	public email: string;

	@Expose()
	@IsString()
	@Length(8)
	@IsOptional()
	public password: string;
}