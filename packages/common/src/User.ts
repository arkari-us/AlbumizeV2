import { Type, type Static } from "typebox";

export const UserSchema = Type.Object({
	userid: Type.String(),
	username: Type.String(),
	exportList: Type.Array(Type.String()),
});

export type User = Static<typeof UserSchema>;
