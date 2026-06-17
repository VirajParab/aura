.PHONY: help install dev dev-ui build release check typecheck preview clean \
        deps-linux deps-linux-cursor deps-rust check-rust check-node doctor \
        manifest cargo-check cargo-clean docs tauri

# AuraOS — Character Platform (Phase 1)
# Run `make` or `make help` to see available commands.

NPM ?= npm
CARGO_HOME ?= $(HOME)/.cargo
CARGO_BIN := $(CARGO_HOME)/bin
export PATH := $(CARGO_BIN):$(PATH)
CARGO ?= $(CARGO_BIN)/cargo

help: ## Show this help
	@echo "AuraOS — available commands"
	@echo ""
	@grep -E '^[a-zA-Z0-9_-]+:.*##' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ── Setup ────────────────────────────────────────────────────────────────────

install: check-node ## Install npm dependencies
	$(NPM) install

deps-rust: ## Install Rust toolchain via rustup
	@command -v $(CARGO) >/dev/null 2>&1 && { echo "Rust already installed: $$($(CARGO) --version)"; exit 0; } || true
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
	@echo ""
	@echo "Rust installed. Cargo: $(CARGO_BIN)/cargo"
	@echo "If commands still fail, run: source $(CARGO_HOME)/env"

check-rust: ## Verify Rust/cargo is available
	@command -v $(CARGO) >/dev/null 2>&1 || { \
		echo "error: cargo not found. Run: make deps-rust"; \
		echo "  then: source $(CARGO_HOME)/env"; \
		exit 1; \
	}

check-node: ## Verify Node.js/npm is available
	@command -v $(NPM) >/dev/null 2>&1 || { echo "error: npm not found. Install Node.js 20+"; exit 1; }

doctor: check-node check-rust ## Check all required tools
	@echo "node:  $$(node --version)"
	@echo "npm:   $$($(NPM) --version)"
	@echo "cargo: $$($(CARGO) --version)"
	@echo "rustc: $$(rustc --version)"
	@echo "OK — ready for make dev"

deps-linux: ## Install Linux system deps for Tauri (requires sudo)
	sudo apt-get update
	sudo apt-get install -y \
		pkg-config \
		libdbus-1-dev \
		libwebkit2gtk-4.1-dev \
		build-essential \
		libssl-dev \
		libgtk-3-dev \
		libayatana-appindicator3-dev \
		librsvg2-dev \
		libx11-dev \
		libxi-dev \
		libxtst-dev

deps-linux-cursor: deps-linux ## Install Linux deps + X11 libs for cursor tracking
	@echo "Cursor tracking: enable device_query in src-tauri/Cargo.toml when ready"

# ── Development ──────────────────────────────────────────────────────────────

dev: check-rust ## Run Tauri app (settings + character overlay)
	PATH="$(CARGO_BIN):$$PATH" $(NPM) run tauri:dev

dev-ui: ## Run Vite frontend only (browser, no Tauri backend)
	$(NPM) run dev

preview: ## Preview production frontend build
	$(NPM) run preview

# ── Build ────────────────────────────────────────────────────────────────────

build: ## Build frontend (TypeScript + Vite)
	$(NPM) run build

release: build check-rust ## Build production Tauri binary
	PATH="$(CARGO_BIN):$$PATH" $(NPM) run tauri:build

# ── Check ────────────────────────────────────────────────────────────────────

typecheck: ## TypeScript check without emit
	$(NPM) exec tsc -- --noEmit

check: typecheck cargo-check ## Run all checks (TS + Rust)

cargo-check: ## Rust compile check (src-tauri)
	cd src-tauri && $(CARGO) check

# ── Characters ───────────────────────────────────────────────────────────────

manifest: ## Regenerate characters/manifest.json from definitions
	node scripts/build-manifest.mjs

# ── Clean ────────────────────────────────────────────────────────────────────

clean: ## Remove frontend build artifacts
	rm -rf dist

cargo-clean: ## Remove Rust build artifacts
	cd src-tauri && $(CARGO) clean

clean-all: clean cargo-clean ## Remove all build artifacts
	rm -rf node_modules

# ── Docs ─────────────────────────────────────────────────────────────────────

docs: ## Open docs index path
	@echo "Documentation: docs/README.md"
	@echo "  Vision:      docs/product/vision.md"
	@echo "  Characters:  docs/product/character-roster.md"
	@echo "  Dev guide:   DEVELOPMENT.md"

# ── Aliases ──────────────────────────────────────────────────────────────────

tauri: dev ## Alias for `make dev`
run: dev   ## Alias for `make dev`
