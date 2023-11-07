SRC = $(shell find src)

.DEFAULT_GOAL := help

.PHONY: clean help lint prepack

clean: ## Clean all build and install artifacts
	@git clean -dfX

dist-cjs: node_modules $(SRC)
	pnpm exec swc ./src --config-file .swcrc-cjs --out-dir dist-cjs
	pnpm exec tsc --declaration --declarationMap false --declarationDir dist-cjs

dist-esm: node_modules $(SRC)
	pnpm exec swc ./src --config-file .swcrc-esm --out-dir dist-esm
	pnpm exec tsc --declaration --declarationMap false --declarationDir dist-esm

lint: node_modules $(SRC)
	pnpm exec eslint src

node_modules: package.json pnpm-lock.yaml
	@pnpm install

prepack: dist-cjs dist-esm

test: node_modules $(SRC)
	pnpm exec jest src

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
