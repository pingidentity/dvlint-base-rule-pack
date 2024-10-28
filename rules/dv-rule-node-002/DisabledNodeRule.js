const { LintRule } = require("@ping-identity/dvlint");

class DisabledNodeRule extends LintRule {
  constructor() {
    super({
      id: "dv-rule-node-002",
      description: "Disabled node found",
      cleans: false,
      reference: "",
    });

    this.addCode("dv-er-node-001", {
      description: "Disabled Node Found",
      message: "Disabled node % found",
      type: "best-practice",
      recommendation: "A disabled '%' node has been found. Consider removing it from the flow.",
    });
    this.addCode("dv-er-node-002", {
      description: "Unconfigured Node Found",
      message: "Unconfigured node % found",
      type: "error",
      recommendation: "Configure unconfigured node from flow.",
    });

  }

  runRule() {
    try {
      for (const flow of this.allFlows) {
        flow?.graphData?.elements?.nodes?.forEach((node) => {
          const { data } = node;

          if (data.isDisabled === true) {
            this.addError("dv-er-node-001", {
              messageArgs: [`(${data.id})`],
              recommendationArgs: [`(${data.id})`],
              nodeId: data.id,
            });
          }

          if (data.status === 'unconfigured') {
            this.addError("dv-er-node-002", {
              messageArgs: [`(${data.id})`],
              nodeId: data.id,
            });
          }
        });
      }
    } catch (err) {
      this.addError(undefined, { messageArgs: [`${err}`] });
    }
  }
}

module.exports = DisabledNodeRule;
