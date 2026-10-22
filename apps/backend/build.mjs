import { build } from "esbuild";
import { dotenvRun } from "@dotenv-run/esbuild";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(backendDir, "../..");

const results = await build({
	write: true,
	bundle: true,
	outfile: resolve(backendDir, "dist/index.js"),
	minify: true,
	platform: "node",
	entryPoints: [resolve(backendDir, "src/server.ts")],
	plugins: [
		dotenvRun({
			verbose: true,
			cwd: backendDir,
			root: projectRoot,
			prefix: "^API",
		}),
	],
});

console.log("Build complete:", results);
