# Contributing

Thank you for any contribution you make to this project.
Before you contribute, please read the following guidelines.

## Project Setup

1. Fork the repository.
2. Clone the repository to your local machine.
3. Run `pnpm install` to install the dependencies.
4. Create a new branch for your feature or bug fix with `git checkout -b feat/branch-name` or `git checkout -b fix/branch-name`.

## Folder Structure

- `docs/`: Contains the documentation website for this project, created with VitePress.
- `examples/`: Contains example projects that demonstrate how to use this project and how it compares to other libraries.
- `packages/`: Contains the source code for the different packages that make up this project.

## Common Commands

- `pnpm style`: Checks the code style of the project.
- `pnpm style:fix`: Checks the code style of the project and fixes issues if possible.
- `pnpm test`: Runs all tests for each package.
- `pnpm test:core`: Runs tests for the core package.
- `pnpm test:react`: Runs tests for the React bindings.
- `pnpm test:validator-zod`: Runs tests for the validator adapter for zod.
- `pnpm build`: Builds all packages.
- `pnpm build:core`: Builds the core package.
- `pnpm build:react`: Builds the React bindings.
- `pnpm build:validator-zod`: Builds the validator adapter for zod.
- `pnpm example:react:complex:form-signals`: Starts the dev server for the complex React example using form-signals.
- `pnpm example:react:complex:react-hook-form`: Starts the dev server for the complex React example using react-hook-form.
- `pnpm example:react:complex:tanstack-form`: Starts the dev server for the complex React example using tanstack-form.
- `pnpm docs:dev`: Starts the dev server for the documentation website.
- `pnpm docs:build`: Builds the documentation website.

## Commit Messages

Please follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0-beta.4/#specification) specification when writing commit messages.

## Pull Requests

When you are ready to submit a pull request, please make sure to do the following:

1. Run `pnpm style` to check the code style.
2. Run `pnpm test` to run all tests.
3. Make sure the tests pass.
4. Make sure the build passes.
5. Make sure the documentation is up-to-date.
6. Make sure the examples are up-to-date.
7. Make sure the README is up-to-date.
