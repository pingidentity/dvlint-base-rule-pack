// const { TestLinter } = require("@pingidentity/dvlint");
const { TestLinter } = require("@pingidentity/dvlint");

const { name } = require("../package.json");

const tester = new TestLinter(__dirname, "../RulePack.js");
tester.runTests();
