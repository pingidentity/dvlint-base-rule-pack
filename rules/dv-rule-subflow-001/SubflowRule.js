const { LintRule } = require("@ping-identity/dvlint");

class DVRule extends LintRule {
  constructor() {
    super({
      id: "dv-rule-subflow-001",
      description: "Checks for subflow name mismatches",
      cleans: false,
      reference: "",
    });

    this.addCode("dv-er-subflow-001", {
      description: "Subflow names mismatched",
      message: "Incorrect or Missing Subflow in (%)",
      type: "error",
      recommendation:
        "Typically caused by having a flow conductor node, but no subflow selected or name mismatch in its configuration",
    });
    this.addCode("dv-er-subflow-002", {
      description: "Circular SubFlow Found",
      message:
        "Circular SubFlow Dependency Found - '%' points back to '%' via subflow",
      type: "error",
      recommendation:
        "This can cause export/import errors, it is recommended to return to a parent flow via HTML JSON success/error",
    });
  }

  // Check a child subflow to make sure it doesn't point back to this flow ID
  isCircularSubflow(subflows, flowId) {
    const flowDetail = subflows.find((v) => v.flowId === flowId);
    return flowDetail !== undefined;
  }

  runRule() {
    try {
      const targetFlow = this.mainFlow;
      const supportingFlows = this.allFlows;

      if (!supportingFlows) {
        return;
      }

      // Create SubFlow Details
      const subflows = this.dvUtil.getSubFlows(targetFlow, supportingFlows);
      subflows?.forEach((subflow) => {
        if (!subflow.name) {
          this.addError("dv-er-subflow-001", { messageArgs: [subflow.flowId] });
        } else {
          if (subflow.name !== subflow.label) {
            this.addError("dv-er-subflow-001", {
              messageArgs: [subflow.flowId],
            });
          }
          // Check for circular subflow dependencies
          if (
            this.isCircularSubflow(
              this.dvUtil.getSubFlows(subflow.detail, supportingFlows),
              targetFlow.flowId
            )
          ) {
            this.addError("dv-er-subflow-002", {
              messageArgs: [subflow.name, targetFlow.name],
            });
          }
        }
      });
    } catch (err) {
      this.addError(undefined, { messageArgs: [`${err}`] });
    }
  }
}

module.exports = DVRule;
