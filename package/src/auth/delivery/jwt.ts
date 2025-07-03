import type { Request, Response } from "express";
import { JWTDeliveryConfig } from "../../config/types";

import { signJWT, verifyJWT } from "../../utils/jwt";

class JWTDelivery {
	private config: JWTDeliveryConfig;

	constructor(jwtConfig: JWTDeliveryConfig) {
		this.config = jwtConfig;
	}

	// Sign JWT
	async signToken(payload: object, res: Response) {
		const token = await signJWT(payload, this.config.secret!, {
			expiresIn: this.config.expiresIn,
		});
		res.cookie("auth_token", token, {
			secure: true,
			httpOnly: true,
			sameSite: "strict",
			maxAge: this.config.expiresIn,
		});

		return { token, res };
	}

	// Verify JWT
	async verifyToken(req: Request) {
		let token: string | undefined;

		if (this.config.sendVia?.includes("header")) {
			token = req.headers["authorization"]?.split(" ")[1];
		}
		if (this.config.sendVia?.includes("cookie")) {
			token =
				token ??
				req.headers.cookie
					?.split("; ")
					.find((c) => c.includes("auth_token"))
					?.split("=")[1];
		}

		if (!token) {
			return { isValid: false, decoded: null };
		}

		try {
			const decoded = await verifyJWT(token || "", this.config.secret!);
			if (!decoded) {
				return { isValid: false, decoded: null };
			}

			return { isValid: true, decoded };
		} catch (error) {
			return {
				decoded: null,
				isValid: false,
			};
		}
	}

	// Clear JWT from cookie
	revokeToken(res: Response) {
		res.clearCookie("auth_token");
	}
}

export default JWTDelivery;
