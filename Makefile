SRC = $(shell find src)

.DEFAULT_GOAL := help

.PHONY: clean help lint prepack

clean: ## Clean all build and install artifacts
	@git clean -dfX

dist-cjs: node_modules $(SRC)
	npx esbuild ./src/** --sourcemap --format=cjs --platform=node --target=node14 --outdir=./dist-cjs

dist-esm: node_modules $(SRC)
	npx esbuild ./src/** --sourcemap --format=esm --outdir=./dist-esm

dist-types: node_modules $(SRC) tsconfig.json
	npx tsc --emitDeclarationOnly --declaration --declarationMap false --declarationDir dist-types

lint: node_modules $(SRC)
	npx eslint src

node_modules: package.json package-lock.json
	@npm ci

prepack: dist-cjs dist-esm dist-types

test: node_modules $(SRC)
	npx jest

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
