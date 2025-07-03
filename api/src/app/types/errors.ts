export enum ErrorCodes {
	UNAUTHORIZED = "Unauthorized",
	USER_NOT_FOUND = "User not found",
	INVALID_TOKEN = "Invalid token",
	LOCATION_NOT_FOUND = "Location not found",
	USER_NOT_PART_OF_LOCATION = "User not part of location",
	FORBIDDEN = "Forbidden",
	INVALID_INPUT = "Invalid input",
	INVALID_USERNAME_OR_PASSWORD = "Invalid username or password",
	NOT_FOUND = "Not found",
	MISSING_REQUIRED_FIELD = "Missing required field",
	CONFLICT = "Conflict",
}

export function getStatusCodeForErrorMessage(errorCode: string): number {
	switch (errorCode) {
		case ErrorCodes.UNAUTHORIZED:
		case ErrorCodes.INVALID_TOKEN:
			return 401;
		case ErrorCodes.USER_NOT_FOUND:
		case ErrorCodes.LOCATION_NOT_FOUND:
			return 404;
		case ErrorCodes.FORBIDDEN:
		case ErrorCodes.USER_NOT_PART_OF_LOCATION:
			return 403;
		default:
			return 500;
	}
}

export class DntelError extends Error {
	statusCode: number;
	constructor(
		public message: string,
		statusCode?: number,
		enforceError: boolean = false
	) {
		const finalMessage = enforceError
			? message
			: Object.values(ErrorCodes).includes(message as any)
				? message
				: "Unknown Error Occurred";
		super(finalMessage);
		this.message = finalMessage;
		this.statusCode = statusCode || getStatusCodeForErrorMessage(message as string);
		this.name = "DntelError";
	}
}
