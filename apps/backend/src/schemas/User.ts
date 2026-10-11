import { UserSchema as schema } from "@albumize/common";
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(schema.properties, {
	timestamps: true,
});

export const User = mongoose.model("User", UserSchema);
