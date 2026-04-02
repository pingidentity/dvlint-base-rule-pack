const { LintRule } = require("@ping-identity/dvlint");

class BatchProcessingFlowRule extends LintRule {
    constructor() {
        super({
            id: "dv-rule-batchProcessingFlow-001",
            description: "Batch processing flow rules",
            cleans: false,
            reference: "",
        });

        this.addCode("dv-er-batchProcessingFlow-001", {
            description: 'Invalid start node configuration in batch processing flow',
            message: 'Invalid start node configuration in batch processing flow',
            type: "error",
            recommendation: "Ensure the flow begins with Start Node and has exactly one outgoing edge.",
        });
        this.addCode("dv-er-batchProcessingFlow-002", {
            description: "All leaf nodes must be end nodes",
            message: "Invalid flow termination configuration in batch processing flow",
            type: "error",
            recommendation: "Ensure every path in the batch processing flow ends with an appropriate end capability: 'End Flow Success', 'End Flow Failure', or both.",
        });
        this.addCode("dv-er-batchProcessingFlow-003", {
            description: "Flow connectors are not supported in batch processing flow",
            message: "Flow connectors are not supported in batch processing flow",
            type: "error",
            recommendation: "Remove all flow connector nodes from this batch processing flow to ensure proper execution.",
        });
        this.addCode("dv-er-batchProcessingFlow-005", {
            description: "UI capabilities are not allowed in batch processing flow",
            message: "UI capabilities are not allowed in batch processing flow",
            type: "error",
            recommendation: "Remove all UI capabilities from the flow. The only UI capabilities allowed are: 'End Flow Success' and 'End Flow Failure', and they must appear only as end nodes.",
        });

    }

    runRule() {
        try {
            const endNodesCapabilities = ["endFlowSuccess", "endFlowFailure"];
            for (const flow of this.allFlows) {
                const { nodes, edges } = flow?.graphData?.elements
                nodes?.forEach((node) => {
                    const { data } = node;
                    const isBatchProcessingFlow = ["BATCH_PROCESSING_SUBFLOW", "BATCH_PROCESSING"].includes(flow.trigger?.type);
                    if (isBatchProcessingFlow) {
                        if (data.nodeType === "START") {
                            // Check if the start node has only one edge
                            const connectedEdges = edges.filter(edge => edge.data.source === data.id);
                            if (connectedEdges.length !== 1) {
                                this.addError("dv-er-batchProcessingFlow-001", {
                                    flowId: flow.flowId
                                });
                            }
                        }

                        const connectedEdges = edges.filter(edge => edge.data.source === data.id);
                        
                        // intermediate node and an end node(Capabilities from Flow Canvas Connector)
                        if (connectedEdges.length > 0 && endNodesCapabilities.includes(data.capabilityName)) {
                            this.addError("dv-er-batchProcessingFlow-002", {
                                flowId: flow.flowId,
                                nodeId: data.id,
                            });
                        }

                        // intermediate and end node should not be UI capabilities
                        if (((connectedEdges.length > 0 || connectedEdges.length === 0) && data.respondToUser && !endNodesCapabilities.includes(data.capabilityName))) {
                            this.addError("dv-er-batchProcessingFlow-005", {
                                flowId: flow.flowId,
                                nodeId: data.id,
                            });
                        }

                        // last node and not an end node
                        if (connectedEdges.length === 0 && !endNodesCapabilities.includes(data.capabilityName)) {
                            this.addError("dv-er-batchProcessingFlow-002", {
                                flowId: flow.flowId,
                                nodeId: data.id,
                            });
                        }

                        // node is flowConnector node
                        if (data.nodeType === "CONNECTION" && data.connectorId === "flowConnector") {
                            this.addError("dv-er-batchProcessingFlow-003", {
                                flowId: flow.flowId,
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

module.exports = BatchProcessingFlowRule;

