import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { LoginBody } from "../../contracts/login.body";
import { login } from "./handlers/login.handler";
import { AccessTokenView } from "../../contracts/accessToken.view";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";

@Controller("auth")
export class AuthController {
    @Post("login")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Login with email and password" })
    @ApiResponse({ status: 200, description: "Logged in successfully" })
    async login(@Body() body: LoginBody): Promise<AccessTokenView> {
        return login(body);
    }
}