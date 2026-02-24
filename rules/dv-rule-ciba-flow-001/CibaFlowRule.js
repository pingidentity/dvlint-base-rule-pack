const { LintRule } = require("@ping-identity/dvlint");
class CibaFlowRule extends LintRule {
    constructor() {
        super({
            id: "dv-rule-ciba-flow-001",
            description: "Ensure flow is have Ciba capabilities nodes",
            cleans: false,
            reference: "",
        });

        this.addCode("dv-er-ciba-flow-001", {
            description: "Required response nodes missing from CIBA flow.",
            message: "Required response nodes missing from CIBA flow.",
            type: "error",
            recommendation: "Add at least one 'Return CIBA Success' and one 'Return CIBA Failure' capability from the PingOne Authentication connector. Both are required to return appropriate responses from a CIBA flow.",
        });
        this.addCode("dv-er-ciba-flow-002", {
            description: "Required execution nodes missing from CIBA flow.",
            message: "Required execution nodes missing from CIBA flow.",
            type: "error",
            recommendation: "Add at least one 'Out-of-Band Start' and one 'Continue' capability from the Flow Conductor connector. Both are required for proper execution of a CIBA flow.",
        });
        this.addCode("dv-er-ciba-flow-003", {
            description: "CIBA response nodes are not allowed in subflows.",
            message: "CIBA response nodes are not allowed in subflows.",
            type: "error",
            recommendation: "Remove the 'Return CIBA Success' and 'Return CIBA Failure' capabilities from subflow - '%'. These nodes must be present only in the main CIBA flow to ensure proper response handling.",
        });
    }

    runRule() {
        try {
            const targetFlow = this.mainFlow;
            const isP1CibaFlow = targetFlow?.settings?.pingOneFlow && targetFlow?.settings?.cibaFlow;
            let oobStartCapabilityPresent = false;
            let oobContinueCapabilityPresent = false;

            //These rules apply only for Pingone CIBA Flows
            if (isP1CibaFlow) {

                const mainFlowExecutionNodes = targetFlow?.graphData?.elements?.nodes?.filter(n => n.data.connectorId === 'flowConnector' && n.data?.isDisabled !== true);

                for (const flow of this.allFlows) {

                    const { nodes } = flow?.graphData?.elements;
                    const p1AuthNodes = nodes?.filter(n => n.data.connectorId === 'pingOneAuthenticationConnector' && n.data?.isDisabled !== true);
                    const cibaErrorCapabilityExist = p1AuthNodes?.some(n => n.data.capabilityName === 'returnCibaError');
                    const cibaSuccessCapabilityExist = p1AuthNodes?.some(n => n.data.capabilityName === 'returnCibaSuccess');

                    // Rule: CIBA response nodes presence
                    if (flow.flowId !== targetFlow.flowId) {
                        //SubFlow Rule: Both returnCibaError and returnCibaSuccess  should not be present in Subflows
                        if ((cibaErrorCapabilityExist || cibaSuccessCapabilityExist)) {
                            const flowConnectorNode = mainFlowExecutionNodes.filter(n => n?.data?.properties?.subFlowId?.value?.value === flow.flowId)
                            this.addError("dv-er-ciba-flow-003", {
                                flowId: targetFlow.flowId,
                                nodeId: flowConnectorNode[0]?.data?.id,
                                recommendationArgs: [`${flow.name}`],
                            });
                        }
                    } else {
                        //Mainflow Rule: Both returnCibaError and returnCibaSuccess are required for CIBA flow response, 
                        //if any of them is missing then throw error.
                        if ((!cibaErrorCapabilityExist || !cibaSuccessCapabilityExist)) {
                            this.addError("dv-er-ciba-flow-001", {
                                flowId: flow.flowId,
                            });
                        }
                    }

                    // Second Rule:  logic for flowConductorConnector capabilities
                    const flowNodes = nodes?.filter(n => n.data.connectorId === 'flowConnector' && n.data?.isDisabled !== true);

                    //Both oobStart and oobContinue are required for CIBA flow execution, if any of them is missing then throw error.
                    //These 2 capabilites can be spread over multiple flows
                    if (flowNodes?.some(n => n.data.capabilityName === 'oobStart')) {
                        oobStartCapabilityPresent = true;
                    }
                    if (flowNodes?.some(n => n.data.capabilityName === 'oobContinue')) {
                        oobContinueCapabilityPresent = true;
                    }
                }
                if ((!oobContinueCapabilityPresent || !oobStartCapabilityPresent)) {
                    this.addError("dv-er-ciba-flow-002", {
                        flowId: targetFlow.flowId,
                    });
                }
            }
        } catch (err) {
            this.addError(undefined, { messageArgs: [`${err}`] });
        }
    }
}

module.exports = CibaFlowRule;