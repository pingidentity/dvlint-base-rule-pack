const { LintRule } = require("@pingidentity/dvlint");

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
      recommendation: "Remove disabled node from flow.",
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
