const { LintRule } = require("@ping-identity/dvlint");

class PingOneFlowRule extends LintRule {
  constructor() {
    super({
      id: "dv-rule-pingOneFlow-001",
      description: "Checks for PingOne Flow configurations",
      cleans: false,
      reference: "",
    });
    this.addCode("dv-er-pingOneFlow-001", {
      description: "Incorrect ending nodes for PingOne flow.",
      message: "Incorrect ending nodes for PingOne flow.",
      type: "error",
      recommendation: "This PingOne-enabled flow is missing an appropriate ending node. These flows should conclude with either a 'Return a Success Response' node or a 'Return an Error Response' node."
    });
  }

  runRule() {
    try {
      const targetFlow = this.mainFlow;

      // Incorrect ending nodes for PingOne flow
      if (targetFlow?.settings?.pingOneFlow) {
        const endNodesCapability = ['createErrorResponse', 'createSuccessResponse'];
        const endNodesData = targetFlow.graphData.elements.nodes.filter(node => endNodesCapability.includes(node.data.capabilityName));
        const nodeIdMap = endNodesData.map(node => node.data.id);
        const nodeSourceMap = targetFlow.graphData.elements.edges.map(edge => edge.data.source);
        let validEndNode = true;
        nodeIdMap.forEach(id => {
          if (nodeSourceMap.includes(id)) {
            validEndNode = false;
          }
        });
        if (!validEndNode) {
          this.addError("dv-er-pingOneFlow-001", {
            messageArgs: [targetFlow.name],
          });
        }
      }

    } catch (err) {
      this.addError(undefined, { messageArgs: [`${err}`] });
    }
  }
}

module.exports = PingOneFlowRule;
