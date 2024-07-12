const { LintRule } = require("@pingidentity/dvlint");

class MultiStartRule extends LintRule {
  constructor() {
    super({
      id: "dv-rule-multi-start-001",
      description:
        "Multiple potential start nodes, or disconnected nodes found",
      cleans: false,
      reference: "",
    });

    this.addCode("dv-er-multi-start-001", {
      description: "Multiple start points or floating node(s) found",
      message: "Node % could be one of multiple start points, or floating",
      type: "error",
      recommendation:
        "Ensure flow has one defined start point, and that no nodes are floating (completely disconnected)",
    });
  }

  runRule() {
    try {
      // Types of nodes to ignore in the edges check
      const ignoreNodeTypes = ["nodeConnector", "annotationConnector"];

      for (const flow of this.allFlows) {
        const notTargets = [];

        flow?.graphData?.elements?.nodes?.forEach((node) => {
          const nodeId = node.data?.id;
          const nodeType = node.data?.connectorId;
          // If this type of node is not in the ignore list, check the edges to see if it is listed as a target
          if (
            !ignoreNodeTypes.includes(nodeType) &&
            flow?.graphData?.elements?.edges?.length > 0
          ) {
            const targets = flow?.graphData?.elements?.edges.filter(
              (edgeNode) => edgeNode.data?.target?.match(nodeId)
            );
            if (targets.length === 0) {
              notTargets.push({ nodeId, nodeType });
            }
          }
        });
        // Should only ever be one node that is not listed as a target, otherwise it is a potential multiple start point, or a floater
        if (notTargets.length > 1) {
          notTargets.forEach((node) =>
            this.addError("dv-er-multi-start-001", {
              messageArgs: [`${node.nodeId} (${node.nodeType})`],
            })
          );
        }
      }
    } catch (err) {
      this.addError(undefined, { messageArgs: [`${err}`] });
    }
  }
}

module.exports = MultiStartRule;
