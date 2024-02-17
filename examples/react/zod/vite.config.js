import path from "node:path";
import react from "@vitejs/plugin-react";
import {defineConfig} from "vite";

export default defineConfig({
	plugins: [
		react({
			babel: {
				plugins: [["module:@preact/signals-react-transform"]],
			},
		}),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	test: {
		include: ["src/**/*.spec.ts"],
	},
});
