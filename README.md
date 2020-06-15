
Tokenization Protocol
=================

The Tokenization Protocol is an Ethereum smart contract for tokenizing real assets. 


Installation
------------
To run, pull the repository from GitHub and install its dependencies. You will need [npm](https://docs.npmjs.com/cli/install) installed.

    git clone https://github.com/konkrete-protocols/tokenization-protocol
    cd tokenization-protocol
    `npm install`

You can then compile the contracts with:

    npm run compile

Note: this project use truffle. The command above is the best way to compile contracts.


Testing
-------
Mocha contract tests are defined under the [test directory](https://github.com/konkrete-protocols/tokenization-protocol/tree/master/test). To run the tests run:

    npm run test

Assertions used in our tests are provided by [ChaiJS](http://chaijs.com).

Code Coverage
-------------
To run code coverage, run:

    npm run coverage

Linting
-------
To lint the code, run:

    npm run lint
