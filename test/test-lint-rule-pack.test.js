// const { TestLinter } = require("@ping-identity/dvlint");
const { TestLinter } = require("@ping-identity/dvlint");

const { name } = require("../package.json");

const tester = new TestLinter(__dirname, "../RulePack.js");
tester.runTests();
