// In types/next-auth.d.ts
declare module "next-auth" {
	interface Session {
		user: {
			id: string;
			roles: string[];
			permissions: string[];
		} & DefaultSession["user"]
	}
}