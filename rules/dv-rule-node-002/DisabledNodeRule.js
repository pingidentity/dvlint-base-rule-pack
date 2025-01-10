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
      message: "Disabled node found",
      type: "error",
      recommendation: "A disabled (% %) node has been found. Consider removing it from the flow.",
    });
    this.addCode("dv-er-node-002", {
      description: "Connector Capability not configured",
      message: "Connector Capability not configured",
      type: "error",
      recommendation: "Configure a capability in '%' to ensure proper operation.",
    });

  }

  runRule() {
    try {
      for (const flow of this.allFlows) {
        flow?.graphData?.elements?.nodes?.forEach((node) => {
          const { data } = node;

          if (data.isDisabled === true) {
            this.addError("dv-er-node-001", {
              flowId: flow.flowId,
              recommendationArgs: [data.id, data.name],
              nodeId: data.id,
            });
          }

          if (data.status === 'unconfigured') {
            const connectorInstanceName = data.name.toLowerCase().includes('connector') ? data.name : data.name + ' connector';
            this.addError("dv-er-node-002", {
              flowId: flow.flowId,
              recommendationArgs: [`${connectorInstanceName}`],
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
