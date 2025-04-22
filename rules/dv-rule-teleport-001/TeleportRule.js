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
      message: "Unused teleport node found",
      type: "error",
      recommendation: "'%' is not being used. Consider removing it from the flow.",
    });
    this.addCode("dv-er-teleport-002", {
      description: "Teleport schema mismatch",
      message:"Teleport schema mismatch",
      type: "error",
      recommendation: "Update the JSON to align with the Teleport node schema, ensuring that the '%' attribute is properly defined.",
    });
    this.addCode("dv-er-teleport-003", {
      description: "Unsupported false branch after teleport node",
      message:"Unsupported false branch after teleport node",
      type: "error",
      recommendation: "Teleport nodes should only be followed by a true path. Remove or reconfigure the false branch in node '%'.",
    });
    this.addCode("dv-er-teleport-004", {
      description: "Missing target node in 'Go to Node' capability",
      message:"Missing target node in 'Go to Node' capability",
      type: "error",
      recommendation: "Configure the 'Node to teleport to' in the 'Go to Node' capability in the Teleport node '%' to ensure the flow transitions correctly to the next step."
    });
  }

  runRule() {
    try {
      const startNodes = {};
      const gotoNodes = [];

      const {nodes, edges} = this.mainFlow?.graphData?.elements;
      // Get teleport start nodes and goto nodes
      nodes?.forEach((node) => {
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
          
          //check if in  goToNode 'Node to teleport to' is not configured
          if (!node.data.properties?.nodeInstanceId?.value) {
            this.addError("dv-er-teleport-004", {
              flowId: this.mainFlow.flowId,
              recommendationArgs: [node.data.id],
              nodeId: node.data.id,
            });
          }
        }

        // Check if the node is a teleport node and it has false branch
        if (node.data.connectorId === 'nodeConnector') {
          const evalNodes = edges.filter(edge => edge.data.source === node.data.id).map(d => d.data.target);
          const connectedNodes = nodes.filter(n => evalNodes.includes(n.data.id));
          if (evalNodes.length >= 1 && connectedNodes.length > 0) {
            connectedNodes.map(cn => {
              if (cn.data.properties) {
                const propertiesStr = JSON.stringify(cn.data.properties);
                if (propertiesStr && (propertiesStr.indexOf('anyTriggersFalse') > -1 || propertiesStr.indexOf('allTriggersFalse') > -1)) {
                  this.addError("dv-er-teleport-003", {
                    flowId: this.mainFlow.flowId,
                    recommendationArgs: [node.data.id],
                    nodeId: node.data.id,
                  });
                }
              }
            });
          }
        }
      });

      // If there is a start node that is not referenced by a go to, generate an error for that node
      Object.entries(startNodes).forEach(([startNodeId, startNodeTitle]) => {
        if (!gotoNodes.includes(startNodeId)) {
          this.addError("dv-er-teleport-001", {
            flowId: this.mainFlow.flowId,
            recommendationArgs: [startNodeId],
            nodeId: startNodeId,
          });
        } else {
          // Check if the goto node has the correct input schema
          const startNodeInputSchema =
            this.dvUtil.getNodeById(startNodeId).data.properties.inputSchema?.value;

          let startNodeInputSchemaJSON = {};
          if (startNodeInputSchema) {
            startNodeInputSchemaJSON = JSON.parse(startNodeInputSchema || "{}");
          }
          const startNodeInputSchemaArr = Object.entries(startNodeInputSchemaJSON.properties || {});
          const startNodeInputSchemaManddatoryArr = startNodeInputSchemaArr.filter(([key, val]) => val.required === true);
          const startNodeMandatoryInpuSchemaKeys = startNodeInputSchemaManddatoryArr.map(([key, val]) => key);

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

            startNodeMandatoryInpuSchemaKeys.forEach((attrName) => {
              if (!gotoSchema.includes(attrName)) {
                    this.addError("dv-er-teleport-002", {
                      flowId: this.mainFlow.flowId,
                      recommendationArgs: [attrName],
                      nodeId: gotoNode.data.id,
                    });
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
