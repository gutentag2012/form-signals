import {defineConfig} from "vite";

export default defineConfig({
	test: {
		name: "form-core",
		dir: "./src",
		watch: false,
		environment: "jsdom",
		globals: false,
		coverage: {
			enabled: true,
			provider: "istanbul",
			include: ["src/**/*"],
      reporter: ["html", "lcov", "text", "text-summary"],
		},
		typecheck: { enabled: true },
	},
});
