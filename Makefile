
build:
	npx truffle build

deploy-pooltoken: build
	npx truffle exec --network $(network) scripts/deploy-pooltoken.js

deploy-tokenization-master: build
	npx truffle exec --network $(network) scripts/deploy-tokenize-master.js

.PHONY: build deploy-pooltoken deploy-tokenization-master
