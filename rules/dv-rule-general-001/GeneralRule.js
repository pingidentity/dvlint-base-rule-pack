/* eslint-disable no-param-reassign */
const { LintRule } = require("@pingidentity/dvlint");

class ExampleRule extends LintRule {
  constructor() {
    super({
      id: "dv-rule-general-001",
      description: "Perform a bunch of general checks that cleaning ability",
      cleans: true,
      reference: "",
    });
  }

  runRule() {
    try {
      const { allFlows } = this;

      allFlows.forEach((f) => {
        // Blank out companyId and customerId
        if (this.cleanFlow) {
          if (f.companyId !== "") {
            f.companyId = "";
            this.addCleanResult("Removed companyId value");
          }
          if (f.customerId !== "") {
            f.customerId = "";
            this.addCleanResult("Removed customerId value");
          }
        }

        // Blank out sktemplate
        if (this.cleanFlow) {
          f?.graphData?.elements?.nodes?.forEach((node) => {
            const { properties } = node.data;
            if (properties?.sktemplate) {
              delete properties.sktemplate;
              this.addCleanResult("Removed sktemplate");
            }
          });
        }

        // Clean LogLevel
        if (this.cleanFlow) {
          const { settings } = f;
          if (settings && settings.logLevel !== 2) {
            settings.logLevel = 2;
            this.addCleanResult("Set logLevel to INFO (2)");
          }
        }
      });
    } catch (err) {
      this.addError(undefined, { messageArgs: [`${err}`] });
    }
  }
}

module.exports = ExampleRule;
