import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { prisma } from "./lib/prisma";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Enable validation
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		})
	);

	// Enable CORS
	app.enableCors({
		origin: "*",
		credentials: true,
		exposedHeaders: ["x-auth"],
	});

	// Set global prefix
	app.setGlobalPrefix("api");

	// Connect to database
	await prisma.$connect();
	console.log("Database connected successfully");


	// Swagger configuration
	const config = new DocumentBuilder()
		.setTitle("Node Course API")
		.setDescription("The Node Course API description")
		.setVersion("1.0")
		.addApiKey(
			{
				type: "apiKey",
				name: "x-auth",
				in: "header",
			},
			"x-auth"
		)
		.build();

	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup("docs", app, document);

	await app.listen(3000);
	console.log("🚀 http://localhost:3000/docs");}

bootstrap();