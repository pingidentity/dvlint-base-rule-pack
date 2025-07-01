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
        let targetEdgeArr = edges?.filter(d => d.data.target).map(m => m.data.target) || [];
        let sourceEdgeArr = edges?.filter(d => d.data.source).map(m => m.data.source) || [];
        const onlyInTargetArr = targetEdgeArr.filter(item => !sourceEdgeArr.includes(item)) || [];
        const cNameArr = nodes?.filter(n => onlyInTargetArr.includes(n.data.id)).map(m => m.data.capabilityName);
        if( !endNodesCapability.some(cap=>cNameArr.includes(cap)) ){
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
          const evalNodes = edges?.filter(edge => edge.data.source === node.data.id).map(d => d.data.target) || [];
          //case where one evalnode is connected to multiple nodes
          let targetFromEvalNodes = [];
          if (evalNodes.length === 1) {
            targetFromEvalNodes = edges?.filter(edge => edge.data.source === evalNodes[0]).map(d => d.data.target) || [];
          }
          //connected nodes of the current node
          const connectedNodes = nodes?.filter(n => evalNodes.includes(n.data.id)) || [];
          let evalNodeArr = [];
          connectedNodes.map(cn => {
            const propertiesStr = cn.data.properties;

            //connectedNodes from current evalNode
            const evalNodeTarget = edges?.filter(edge => edge.data.source === cn.data.id).map(d => d.data.target) || [];
            if (propertiesStr) {
              for (let key in propertiesStr) {
                if (evalNodeTarget.includes(key)) {
                  const value = propertiesStr[key].value;
                  evalNodeArr.push(value);
                }
              }
            }
          });

          const falseBranchCount = evalNodeArr?.filter(d => d === 'allTriggersFalse' || d === "anyTriggersFalse").length;
          const trueBranchCount = evalNodeArr?.filter(d => d === 'allTriggersTrue' || d === "anyTriggersTrue").length;
          const noCompleteTriggerBranch = evalNodeArr?.filter(d => d === 'allTriggersComplete' || d === 'always').length === 0;
          if (noCompleteTriggerBranch) {
            if (
              ((targetFromEvalNodes.length >= 2 || connectedNodes.length >= 2) && (!trueBranchCount || trueBranchCount !== 1) && falseBranchCount !== 1) ||   // in case of singleEval has multiple branches
              ((connectedNodes.length === 1 && targetFromEvalNodes.length === 1) && falseBranchCount === 1) ||                                                // if only one false branch
              ((connectedNodes.length === 1 && targetFromEvalNodes.length === 1) && (trueBranchCount === 1 || trueBranchCount === 0)) ||                      // if only one true branch
              (connectedNodes.length >= 2 && !(trueBranchCount >= 1) && !(falseBranchCount >= 1)) ||                                                          // if not at least one false branch and one true branch
              (connectedNodes.length >= 2 && trueBranchCount >= 1 && falseBranchCount !== 1) ||                                                               // if all true branches
              (connectedNodes.length >= 2 && falseBranchCount >= 1 && (trueBranchCount && trueBranchCount !== 1))                                             // if all false branches
            ) {
              this.addError("dv-er-pingOneFlow-002", {
                flowId: this.mainFlow.flowId,
                recommendationArgs: [node.data.title || node.data.capabilityName],
                messageArgs: [node.data.title || node.data.capabilityName],
                nodeId: node.data.id,
              });
            }
          }

        }
      })

    } catch (err) {
      this.addError(undefined, { messageArgs: [`${err}`] });
    }
  }
}

module.exports = PingOneFlowRule;
