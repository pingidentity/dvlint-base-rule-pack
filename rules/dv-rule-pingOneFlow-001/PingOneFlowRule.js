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
      recommendation: "This PingOne-enabled flow is missing appropriate ending nodes. These flows should conclude with either a 'Return Success Response (Redirect Flows)' node or a 'Return Error Response (Redirect Flows)' node of the PingOne Authentication connector."
    });
    this.addCode("dv-er-pingOneFlow-002", {
      description: "Missing false path in capability of PingOne connector.",
      message: "Missing false path in '%' capability of PingOne connector.",
      type: "error",
      recommendation: "Define both true and false paths in '%' capability to handle all outcomes."
    });
  }

  runRule() {
    try {
      const targetFlow = this.mainFlow;

      const { nodes, edges } = targetFlow?.graphData?.elements;
      // Incorrect ending nodes for PingOne flow
      if (targetFlow?.settings?.pingOneFlow) {
        const endNodesCapability = ['returnSuccessResponseRedirect', 'returnErrorResponseRedirect'];
        const endNodesData = nodes?.filter(node => endNodesCapability.includes(node.data.capabilityName)) || [];
        const nodeIdMap = endNodesData.map(node => node.data.id);
        const nodeSourceMap = targetFlow.graphData.elements.edges?.map(edge => edge.data.source) || [];
        let validEndNode = true;
        nodeIdMap.forEach(id => {
          if (nodeSourceMap.includes(id)) {
            validEndNode = false;
          }
        });
        if (!validEndNode) {
          this.addError("dv-er-pingOneFlow-001", {
            flowId: targetFlow.flowId,
            messageArgs: [targetFlow.name],
          });
        }
      }


      // Check for missing false path in capability of pingOneSSOConnector connector
      nodes.forEach((node) => {
        if (node.data.connectorId === 'pingOneSSOConnector') {
          //target nodes of the current node
          const evalNodes = edges.filter(edge => edge.data.source === node.data.id).map(d => d.data.target);
          //connected nodes of the current node
          const connectedNodes = nodes.filter(n => evalNodes.includes(n.data.id));
          let evalNodeArr = [];
          connectedNodes.map(cn => {
            const propertiesStr = cn.data.properties;
            if (propertiesStr) {
              for (let i in propertiesStr) {
                const value = propertiesStr[i].value;
                evalNodeArr.push(value);
              }
            }
          });

          const falseBranchCount = evalNodeArr.filter(d => d === 'allTriggersFalse' || d === "anyTriggersFalse").length;
          const trueBranchCount = evalNodeArr.filter(d => d === 'allTriggersTrue' || d === "anyTriggersTrue").length;
          // const noFalseNode = evalNodeArr.indexOf('allTriggersFalse') === -1 || evalNodeArr.indexOf('anyTriggersFalse') === -1;
          if (
            (connectedNodes.length === 1 && falseBranchCount === 1) ||
            (connectedNodes.length === 1 && trueBranchCount === 1) ||
            (evalNodeArr.length === 2 && falseBranchCount === 0) ||
            (connectedNodes.length === 2 && trueBranchCount !== 1 && falseBranchCount !== 1)
          ) {
            this.addError("dv-er-pingOneFlow-002", {
              flowId: this.mainFlow.flowId,
              recommendationArgs: [node.data.capabilityName],
              messageArgs: [node.data.capabilityName],
              nodeId: node.data.id,
            });
          }
        }
      })

    } catch (err) {
      this.addError(undefined, { messageArgs: [`${err}`] });
    }
  }
}

module.exports = PingOneFlowRule;
