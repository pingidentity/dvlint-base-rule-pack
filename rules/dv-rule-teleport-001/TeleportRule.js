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
      description: "Unsused Teleport Found",
      message: "Teleport '%' found, but never used",
      type: "error",
      recommendation:
        "Teleport start nodes that are not used should be removed from a flow.",
    });
    this.addCode("dv-er-teleport-002", {
      description: "Teleport schema mismatch",
      message:
        "Teleport schema mismatch.  Attribute '%' found, but not defined",
      type: "error",
      recommendation: "Edit JSON to Teleport schema.",
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
      Object.entries(startNodes).forEach(([nodeId, nodeTitle]) => {
        if (!gotoNodes.includes(nodeId)) {
          this.addError("dv-er-teleport-001", {
            messageArgs: [`${nodeTitle} (${nodeId})`],
            nodeId,
          });
        } else {
          // Check if the goto node has the correct input schema
          const gotoNodeInputSchema =
            this.dvUtil.getNodeById(nodeId).data.properties.inputSchema?.value;

          let gotoNodeInputSchemaJSON = {};
          if (gotoNodeInputSchema) {
            gotoNodeInputSchemaJSON = JSON.parse(gotoNodeInputSchema);
          }

          // Get all nodes with the instanceId of the goto node
          const nodes = this.mainFlow?.graphData?.elements?.nodes?.filter(
            (node) =>
              node.data?.properties?.nodeInstanceId?.value?.match(nodeId)
          );

          nodes?.forEach((node) => {
            // get all schema items from properties, except nodeInstanceId
            const callingSchema = Object.keys(node.data.properties).filter(
              (prop) => prop !== "nodeInstanceId" && prop !== "nodeTitle"
            );

            callingSchema.forEach((attrName) => {
              if (
                gotoNodeInputSchemaJSON.properties &&
                gotoNodeInputSchemaJSON.properties[attrName] === undefined
              ) {
                this.addError("dv-er-teleport-002", {
                  messageArgs: [attrName],
                  nodeId: node.data.id,
                });

                if (this.cleanFlow) {
                  const { data } = node;
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
