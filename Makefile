NETWORK=kovan

build:
	npx truffle build

deploy-pooltoken: build
	npx truffle exec --network $(NETWORK) scripts/deploy-pooltoken.js

.PHONY: build deploy-pooltoken
