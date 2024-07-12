const { LintRule } = require("@ping-identity/dvlint");

class DVRule extends LintRule {
  constructor() {
    super({
      id: "dv-rule-variables-001",
      description:
        "Ensure that flow variables are used in flow.  And check for flow variables referenced in nodes but not defined",
      cleans: false,
      reference: "",
    });

    this.addCode("dv-er-variable-001", {
      description: "Unsused Variable Found",
      message: "Variable '%' found, but never used",
      type: "error",
      recommendation:
        "This can lead to variables/data to be included in flows that should be removed.",
    });
    this.addCode("dv-er-variable-002", {
      description:
        "Variable '%' used, but never defined in a Variable connector",
      message: "Variable '%' used, but never defined in a Variable connector",
      type: "error",
      recommendation:
        "This can lead to data that is expected causing undesired results in the flow.",
    });
  }

  runRule() {
    try {
      const flowVars = new Set(this.dvUtil.getFlowVariables());
      const flowVarRefs = new Set();

      // Create Set of the flow variable references (starting with {{global.flow.variables...)
      flowVars?.forEach((v) => {
        flowVarRefs.add(v.ref);
      });

      // Search the entire flow for any references to {{global.flow.variables...
      const stringToTest = JSON.stringify(this.mainFlow);
      const regexToTest = /\{\{global\.flow\.variables\..[a-zA-Z0-9]*\}\}/g;
      const usedVarRefs = new Set(stringToTest.match(regexToTest));

      usedVarRefs?.forEach((m) => {
        if (!flowVarRefs.has(m)) {
          this.addError("dv-er-variable-002", { messageArgs: [m] });
        }
      });

      flowVars?.forEach((v) => {
        if (!usedVarRefs.has(v.ref)) {
          this.addError("dv-er-variable-001", { messageArgs: [v.ref] });
        }
      });
    } catch (err) {
      this.addError(undefined, { messageArgs: [`${err}`] });
    }
  }
}

module.exports = DVRule;
