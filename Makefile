# Makefile

.PHONY: install run
.DEFAULT_GOAL := run

install:
	@echo "--- installing"
	npm install

run:
	@echo "--- running"
	npm run dev
