const { LintRule } = require("@ping-identity/dvlint");

class TeleportRule extends LintRule {
  constructor() {
    super({
      id: "dv-rule-teleport-001",
      description: "Check for unused teleport nodes",
      cleans: true,
      reference: "",
    });

    this.addCode("dv-er-teleport-001", {
      description: "Unused Teleport Found",
      message: "Teleport '%' found, but never used",
      type: "error",
      recommendation:
        "A '%' teleport start node has been found, but is not being used. Consider removing it from the flow.",
    });
    this.addCode("dv-er-teleport-002", {
      description: "Teleport schema mismatch",
      message:
        "Teleport schema mismatch.  Attribute '%' found, but not defined",
      type: "error",
      recommendation: "Update the JSON to align with the Teleport node schema, ensuring that the '%' attribute is properly defined..",
    });
  }

  runRule() {
    try {
      const startNodes = {};
      const gotoNodes = [];

      // Get teleport start nodes and goto nodes
      this.mainFlow?.graphData?.elements?.nodes?.forEach((node) => {
        if (
          node.data?.connectorId?.match("nodeConnector") &&
          node.data?.capabilityName?.match("startNode")
        ) {
          startNodes[node.data.id] = node.data.properties?.nodeTitle?.value;
        }
        if (
          node.data?.connectorId?.match("nodeConnector") &&
          node.data?.capabilityName?.match("goToNode")
        ) {
          gotoNodes.push(node.data.properties?.nodeInstanceId?.value);
        }
      });

      // If there is a start node that is not referenced by a go to, generate an error for that node
      Object.entries(startNodes).forEach(([startNodeId, startNodeTitle]) => {
        if (!gotoNodes.includes(startNodeId)) {
          this.addError("dv-er-teleport-001", {
            messageArgs: [`${startNodeTitle} (${startNodeId})`],
            nodeId: startNodeId,
          });
        } else {
          // Check if the goto node has the correct input schema
          const startNodeInputSchema =
            this.dvUtil.getNodeById(startNodeId).data.properties.inputSchema?.value;

          let startNodeInputSchemaJSON = {};
          if (startNodeInputSchema) {
            startNodeInputSchemaJSON = JSON.parse(startNodeInputSchema);
          }

          // Get all gotoNodes with the instanceId of the goto node
          const gotoNodes = this.mainFlow?.graphData?.elements?.nodes?.filter(
            (node) =>
              node.data?.properties?.nodeInstanceId?.value?.match(startNodeId) &&
              node.data.capabilityName === "goToNode"
          );

          gotoNodes?.forEach((gotoNode) => {
            // get all schema items from properties, except nodeInstanceId
            const gotoSchema = Object.keys(gotoNode.data.properties).filter(
              (props) => props !== "nodeInstanceId" && props !== "nodeTitle"
            );

            gotoSchema.forEach((attrName) => {
              if (
                startNodeInputSchemaJSON.properties &&
                startNodeInputSchemaJSON.properties[attrName] === undefined
              ) {
                this.addError("dv-er-teleport-002", {
                  messageArgs: [attrName],
                  nodeId: gotoNode.data.id,
                });

                if (this.cleanFlow) {
                  const { data } = gotoNode;
                  delete data.properties[attrName];
                  this.addCleanResult(
                    `Removed teleport goto node attribute ${attrName}`
                  );
                }
              }
            });
          });
        }
      });
    } catch (err) {
      this.addError(undefined, { messageArgs: [`${err}`] });
    }
  }
}

module.exports = TeleportRule;
