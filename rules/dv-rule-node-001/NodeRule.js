const { LintRule } = require("@ping-identity/dvlint");

const backgroundColor = {
  httpConnector_createSuccessResponse: "#9dc967",
  httpConnector_createErrorResponse: "#ffc8c1",
};

class NodeRule extends LintRule {
  constructor() {
    super({
      id: "dv-rule-node-001",
      description: "Ensure nodes have names/titles",
      cleans: false,
      reference: "",
    });

    this.addCode("dv-bp-node-001", {
      description: "All nodes should have a title",
      message: "Missing node title",
      type: "best-practice",
      recommendation: "The (% %) node is missing a title. For optimal clarity, add a descriptive title.",
    });
    this.addCode("dv-bp-node-002", {
      description: "All success/error JSON nodes should proper colors",
      message: "Incorrect node color",
      type: "best-practice",
      recommendation: "The (% %) is not using the correct color. To ensure consistency, use the recommended color: [%].",
    });
    this.addCode("dv-bp-node-003", {
      description: "All nodes should have a description",
      message: "Missing node description",
      type: "best-practice",
      recommendation: "The (% %) node is missing a description. For optimal clarity, add a meaningful description.",
    });
    this.addCode("dv-er-node-004", {
      description: "Form not selected",
      message: "Form not selected",
      type: "error",
      recommendation: "A form is not selected in the <%> connector. Select a form to complete the configuration.",
    });
    this.addCode("dv-er-node-005", {
      description: "'Expire Flow Instance Cache' enabled in an intermediate node",
      message: "'Expire Flow Instance Cache' enabled in an intermediate node",
      type: "error",
      recommendation: "This setting should only be used on flow-ending nodes. Disable it on intermediate node <nodeId> to prevent execution issues.",
    });
    
  }

  runRule() {
    try {
      const ignoreNodeTypes = ["nodeConnector", "functionsConnector"];
      for (const flow of this.allFlows) {
        const { nodes, edges } = flow?.graphData?.elements
        const nodeSourceMap = edges?.map(edge => edge.data.source) || [];
        // const multiValueSourceId = edges?.filter(edge => edge.data.multiValueSourceId).map(ed => ed.data.multiValueSourceId) || [];

        nodes?.forEach((node) => {
          const { data } = node;

          // Check for node title
          if (
            data.nodeType === "CONNECTION" &&
            !(data.capabilityName === 'goToNode' || data.capabilityName === 'returnBackToCallingNode') &&
            !data.properties?.nodeTitle?.value
          ) {
            this.addError("dv-bp-node-001", {
              flowId: flow.flowId,
              recommendationArgs: [data.id, data.name],
              nodeId: data.id,
            });
          }

          // Check for node description
          if (
            !ignoreNodeTypes.includes(data.connectorId) &&
            data.nodeType === "CONNECTION" &&
            !data.properties?.nodeDescription?.value
          ) {
            this.addError("dv-bp-node-003", {
              flowId: flow.flowId,
              recommendationArgs: [data.id, data.name],
              nodeId: data.id,
            });
          }

          // Check for Success/Error JSON background colors
          const connectorCapability = `${data.connectorId}_${data.capabilityName}`;
          if (
            Object.keys(backgroundColor).find(
              (o) => o === `${connectorCapability}`
            )
          ) {
            if (
              !data.properties?.backgroundColor?.value
                .toLowerCase()
                .startsWith(backgroundColor[connectorCapability])
            ) {
              this.addError("dv-bp-node-002", {
                flowId: flow.flowId,
                recommendationArgs: [data.id, data.name, backgroundColor[connectorCapability]],
                nodeId: data.id,
              });
            }
          }

          //check for form selection (connectorId:pingOneFormsConnector)
          if (
            data.nodeType === "CONNECTION" &&
            data.connectorId === "pingOneFormsConnector" &&
            data.capabilityName === "customForm" &&
            !data.properties?.form?.value
          ) {
            this.addError("dv-er-node-004", {
              flowId: flow.flowId,
              recommendationArgs: [data.id],
              nodeId: data.id,
            });
          }

          //check if Expire Flow Instance Cache enabled in an intermediate node
          if (data.nodeType === "CONNECTION" && data.properties?.oeInteractionCacheExpire?.value && nodeSourceMap.includes(data.id)) {
            this.addError("dv-er-node-005", {
              flowId: flow.flowId,
              recommendationArgs: [data.id],
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

module.exports = NodeRule;
