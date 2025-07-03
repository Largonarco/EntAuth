import crypto from "crypto";

const API_KEY_HASH_SECRET = process.env.API_KEY_HASH_SECRET;

if (!API_KEY_HASH_SECRET) {
	throw new Error("API_KEY_HASH_SECRET environment variable is required");
}

export const generateApiKeyAndHash = (): { apiKey: string; hash: string } => {
	const apiKey = crypto.randomBytes(32).toString("hex");

	const prefix = apiKey.slice(0, 8);

	const hmac = crypto.createHmac("sha256", API_KEY_HASH_SECRET);
	hmac.update(apiKey);
	const fullHash = hmac.digest("hex");

	const hash = `${prefix}:${fullHash}`;

	return { apiKey, hash };
};

export const verifyApiKey = (apiKey: string, hash: string): boolean => {
	const [_, fullHash] = hash.split(":");

	const hmac = crypto.createHmac("sha256", API_KEY_HASH_SECRET);
	hmac.update(apiKey);
	const calculatedHash = hmac.digest("hex");

	return fullHash === calculatedHash;
};

const deriveKey = (salt: Buffer): Buffer => {
	return crypto.pbkdf2Sync(API_KEY_HASH_SECRET, salt, 100000, 32, "sha256");
};

export const encrypt = (text: string): string => {
	const salt = crypto.randomBytes(16);
	const iv = crypto.randomBytes(12); // GCM uses 12-byte IV

	const key = deriveKey(salt);

	const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

	let encrypted = cipher.update(text, "utf8");
	const final = cipher.final();
	const encryptedBuffer = Buffer.concat([encrypted, final]);

	const authTag = cipher.getAuthTag();

	const combined = Buffer.concat([salt, iv, authTag, encryptedBuffer]);

	return combined.toString("base64");
};

export const decrypt = (encryptedData: string): string => {
	try {
		const combined = Buffer.from(encryptedData, "base64");

		const salt = combined.slice(0, 16);
		const iv = combined.slice(16, 28); // GCM IV is 12 bytes
		const authTag = combined.slice(28, 44); // Auth tag is 16 bytes
		const encrypted = combined.slice(44);

		const key = deriveKey(salt);

		const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
		decipher.setAuthTag(authTag);

		const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
			"utf8"
		);

		return decrypted;
	} catch (error) {
		throw new Error("Failed to decrypt data: Invalid encrypted data or wrong secret");
	}
};
