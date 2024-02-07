import {defineConfig} from "vite";

export default defineConfig({
	test: {
		name: "form-core",
		dir: "./src",
		watch: false,
		environment: "jsdom",
		globals: true,
		coverage: {
			enabled: true,
			provider: "istanbul",
			include: ["src/**/*"],
		},
		typecheck: { enabled: true },
	},
});
