const { LintRule } = require("@pingidentity/dvlint");

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
      message: "Missing nodeTitle on node (% - %)",
      type: "best-practice",
      recommendation: "A node title should be added",
    });
    this.addCode("dv-bp-node-002", {
      description: "All success/error JSON nodes should proper colors",
      message: "Incorrect node color [%] - %",
      type: "best-practice",
      recommendation: "Please use this color: [%]",
    });
  }

  runRule() {
    try {
      for (const flow of this.allFlows) {
        flow?.graphData?.elements?.nodes?.forEach((node) => {
          const { data } = node;

          // Check for node title
          if (
            data.nodeType === "CONNECTION" &&
            !data.properties?.nodeTitle?.value &&
            !(
              (data.name === "Teleport" || data.name === "Node") &&
              data.capabilityName === "goToNode"
            )
          ) {
            this.addError("dv-bp-node-001", {
              messageArgs: [data.id, data.name],
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
                messageArgs: [
                  data.properties?.backgroundColor?.value.toLowerCase(),
                  `${data.name} (${data.id}) - ${data.capabilityName}`,
                ],
                recommendationArgs: [backgroundColor[connectorCapability]],
                nodeId: data.id,
              });
            }
          }
        });
      }
    } catch (err) {
      this.addError(undefined, { messageArgs: [`${err}`] });
    }
  }
}

module.exports = NodeRule;
