import AuthAPI from "../../../api";
import { WorkOS } from "@workos-inc/node";

import { AuthConfig } from "../../../config/types";
import OAuth from "./oauth";
import Password from "./password";
import MagicLink from "./magic-link";

class Standard {
	private workos: WorkOS;
	private authAPI: AuthAPI;
	private config: AuthConfig;

	constructor(config: AuthConfig, authAPI: AuthAPI) {
		this.config = config;
		this.authAPI = authAPI;
		this.workos = new WorkOS(config.workos?.clientSecret!);
	}

	public oauth(provider: "apple" | "google" | "microsoft" | "github") {
		const providerMap = {
			apple: "AppleOAuth",
			google: "GoogleOAuth",
			github: "GithubOAuth",
			microsoft: "MicrosoftOAuth",
		};

		return new OAuth(
			this.config,
			this.authAPI,
			this.workos,
			providerMap[provider] as "AppleOAuth" | "GoogleOAuth" | "GithubOAuth" | "MicrosoftOAuth"
		);
	}

	public password() {
		return new Password(this.config, this.authAPI, this.workos);
	}

	public magicLink() {
		return new MagicLink(this.config, this.authAPI, this.workos);
	}
}

export default Standard;
