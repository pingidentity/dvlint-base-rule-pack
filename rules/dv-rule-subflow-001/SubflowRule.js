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
      message: "Incorrect or missing subflow",
      type: "error",
      recommendation:
        "There is an incorrect or missing subflow in the (%) flow. Ensure that the appropriate subflow is selected and that the names match within the configuration.",
    });
    this.addCode("dv-er-subflow-002", {
      description: "Circular SubFlow Found",
      message:"Circular subflow dependency found",
      type: "error",
      recommendation:
        "The main flow and subflow  reference each other, creating a circular dependency loop. Modify the flow structure to ensure subflows do not point back to parent flows, preventing execution deadlocks.",
    });
    this.addCode("dv-er-subflow-003", {
      description: "Missing Input schema values",
      message: "Subflow input schema missing",
      type: "error",
      recommendation: "The input schema values for the '%' subflow are not currently configured. Configure the schema in the subflow.",
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
      let subflowIdInputSchemaMap = {};
      subflows?.forEach((subflow) => {
        if (!subflow.name) {
          this.addError("dv-er-subflow-001", {
            flowId: subflow.flowId,
            recommendationArgs: [subflow.flowId]
          });
        } else {
          if (subflow.name !== subflow.label) {
            this.addError("dv-er-subflow-001", {
              flowId: subflow.flowId,
              recommendationArgs: [subflow.flowId],
            });
          }
          // Check for circular subflow dependencies
          if (
            this.isCircularSubflow(
              this.dvUtil.getSubFlows(subflow.detail, supportingFlows),
              targetFlow.flowId
            )
          ) {
            subflow?.detail?.graphData?.elements?.nodes?.forEach(node => {
              if (node.data.nodeType === 'CONNECTION' && node.data.connectorId === 'flowConnector') {
                if (node.data.properties.subFlowId?.value?.value === targetFlow.flowId) {
                  this.addError("dv-er-subflow-002", {
                    flowId: subflow.flowId,
                    nodeId: node.data.id
                  });
                }
              }
            });
          }

          // creating subflow and its required fields map
          const requiredSubflowInputSchema = subflow.detail.inputSchema && subflow.detail.inputSchema.filter(schema => schema.required).map(s => s.propertyName);
          subflowIdInputSchemaMap[subflow.flowId] = requiredSubflowInputSchema;
        }
      });

      // Check for missing inputSchema values of subFlow in main flow
      let missingFields = [];
      if (Object.keys(subflowIdInputSchemaMap).length > 0) {
        targetFlow.graphData.elements.nodes.forEach(node => {
          if (node.data.nodeType === 'CONNECTION' && node.data.connectorId === 'flowConnector') {
            const propertyKeyArr = Object.keys(node.data.properties);
            const selectedSubflowId = node.data.properties.subFlowId?.value?.value || '';
            if (propertyKeyArr.length > 0 && (selectedSubflowId in subflowIdInputSchemaMap)) {
              missingFields = subflowIdInputSchemaMap[selectedSubflowId]?.filter(field => !propertyKeyArr.includes(field));
              if (missingFields?.length > 0) {
                const selectedSubflowName = node.data.properties?.subFlowId?.value?.label;
                this.addError("dv-er-subflow-003", {
                  flowId: targetFlow.flowId,
                  recommendationArgs: [selectedSubflowName],
                  nodeId: node.data.id,
                });
              }
            }
          }
        });
      }

    } catch (err) {
      this.addError(undefined, { messageArgs: [`${err}`] });
    }
  }
}

module.exports = DVRule;
