const { LintRulePack } = require("@pingidentity/dvlint");

const {
  name,
  version,
  description,
  homepage,
  author,
} = require("./package.json");

class RulePack extends LintRulePack {
  constructor() {
    super({
      directory: __dirname,
      version,
      name,
      description,
      homepage,
      author,
    });
  }
}

module.exports = RulePack;
