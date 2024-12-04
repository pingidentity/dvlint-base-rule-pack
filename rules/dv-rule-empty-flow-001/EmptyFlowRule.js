const { LintRule } = require("@ping-identity/dvlint");

class EmptyFlow extends LintRule {
  constructor() {
    super({
      id: "dv-rule-empty-flow-001",
      description: "Ensure the flow is not empty",
      cleans: false,
      reference: "",
    });

    this.addCode("dv-er-empty-flow-001", {
      description: "The flow has no nodes, it is empty",
      message: "Flow is empty",
      type: "error",
      recommendation: "An empty flow has been found. If it's not being used, remove it.",
    });
  }

  runRule() {
    try {
      for (const flow of this.allFlows) {
        if (Object.keys(flow.graphData.elements).length === 0) {
          this.addError("dv-er-empty-flow-001",
            { flowId: flow.flowId });
        }
      }
    } catch (err) {
      this.addError(undefined, { messageArgs: [`${err.message}`] });
    }
  }
}

module.exports = EmptyFlow;
