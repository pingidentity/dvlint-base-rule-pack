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
      description: "Unused Variable Found",
      message: "Unused Variable Found",
      type: "best-practice",
      recommendation:
        "The '%' variable has been found but is not utilized in the flow. Consider removing the unused variable.",
    });
    this.addCode("dv-er-variable-002", {
      description:"Undefined variable found",
      message: "Undefined variable found",
      type: "error",
      recommendation:
        "The '%' variable is not defined within a variable connector, which may lead to unexpected behavior. Define the variable appropriately.",
    });

    this.addCode("dv-er-variable-003", {
      description: "Referenced node in variable doesn't exist",
      message: "Referenced node in local variable doesn't exist",
      type: "error",
      recommendation: "The local variable(s) - '%' contains a node id which doesn't exist within the flow."
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


      // Logic to check if local variable nodeId is from the same flow
      const targetFlow = this.mainFlow;
      const mainFlowNodeIdArr = targetFlow?.graphData.elements?.nodes?.map(node => node.data.id);

      targetFlow?.graphData?.elements?.nodes?.forEach((node) => {

        let properties = node?.data?.properties;
        let propertiesContent = properties;
        if (node?.data.connectorId === "pingOneSSOConnector" && node?.data?.properties && 'identifier' in node?.data?.properties) {
          let { identifier, ...rest } = properties;
          propertiesContent = rest;
        }

        let stringVal = JSON.stringify(propertiesContent) || '';

        const pattern = /\{\{(.*?)\}\}/g; // regex pattern to match all instances of {{...}}
        const matches = [...stringVal.matchAll(pattern)];
        const localVarArray = matches.map(match => match[1]);
        const uniqueLocalVariables = [...new Set(localVarArray)];

        const nodeIdPattern = /\b[a-z0-9]{10}\b/g; // regx to pick nodeIds
        let localVarNodeIdArr = [];

        //unused variable check
        const flowVariables = node.data.properties?.saveFlowVariables?.value;
        if (node.data.connectorId === 'variablesConnector' && flowVariables?.length > 0) {
          flowVariables?.forEach((flowVar) => {
            if (!usedVarRefs.has(`{{global.flow.variables.${flowVar.name}}}`)) {
              this.addError("dv-er-variable-001", {
                flowId: this.mainFlow.flowId,
                recommendationArgs: [`{{global.flow.variables.${flowVar.name}}}`],
                nodeId: node.data.id
              });
            }
          });
        }

        uniqueLocalVariables.forEach(v => {
          //check undefined variables
          if (v.includes('global.flow.variables.')) {
            if (!flowVarRefs.has(`{{${v}}}`)) {
              this.addError("dv-er-variable-002", {
                flowId: this.mainFlow.flowId,
                recommendationArgs: [`{{${v}}}`],
                nodeId: node.data.id
              });
            }
          }
          const localPlusNodeidStr = v.substring(0,16)
          if (v.includes('local.')) {
            const matchesNodeId = [...localPlusNodeidStr.matchAll(nodeIdPattern)];
            let nodeIds = matchesNodeId.map(match => match[0])
            localVarNodeIdArr = [...localVarNodeIdArr, ...nodeIds];
          }
        })
        const uniqueNodeIds = [...new Set(localVarNodeIdArr)];

        let errorIdToShow = []
        uniqueNodeIds.forEach(nodeId => {
          if (!mainFlowNodeIdArr.includes(nodeId)) {
            errorIdToShow.push(nodeId);
          }
        });

        if (errorIdToShow.length > 0) {
          const matchingFullStrings = uniqueLocalVariables.filter(fullString =>
            errorIdToShow.some(substring => fullString.includes(substring))
          );

          this.addError("dv-er-variable-003", {
            flowId: this.mainFlow.flowId,
            recommendationArgs: [matchingFullStrings.join(', '), node.data.id],
            nodeId: node.data.id
          });
        }

      });

    } catch (err) {
      this.addError(undefined, { messageArgs: [`${err}`] });
    }
  }
}

module.exports = DVRule;
