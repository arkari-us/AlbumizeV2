import type { User as UserType } from "@albumize/common";
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema<UserType>(
	{
		userid: { type: String, required: true },
		username: { type: String, required: true },
		exportList: { type: [String], default: [] },
	},
	{ timestamps: true },
);

export const User = mongoose.model("User", UserSchema);
