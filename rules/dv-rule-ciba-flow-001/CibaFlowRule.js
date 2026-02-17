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
            recommendation:"Remove the 'Return CIBA Success' and 'Return CIBA Failure' capabilities from subflow - '%'. These nodes must be present only in the main CIBA flow to ensure proper response handling.",  
        });

    
    }

    runRule() {
       try {
            const targetFlow = this.mainFlow;
            const isP1CibaFlow = targetFlow?.settings?.pingOneFlow && targetFlow?.settings?.cibaFlow ;
            //These rules apply only for Pingone CIBA Flows
            if(isP1CibaFlow){
                for (const flow of this.allFlows) {        
                    const { nodes } = flow?.graphData?.elements;
                    //Get all flow connector nodes for Rule 3
                    const  mainFlowNodes  = targetFlow?.graphData?.elements?.nodes?.filter(n => n.data.connectorId === 'flowConnector' && n.data?.isDisabled !== true);
                    
                    // First Rule:  logic for pingOneAuthenticationConnector capabilities
                    const p1AuthNodes = nodes?.filter(n => n.data.connectorId === 'pingOneAuthenticationConnector' && n.data?.isDisabled !== true);

                    const cibaErrorCapabilityExist = p1AuthNodes?.some(n => n.data.capabilityName === 'returnCibaError');
                    const cibaSuccessCapabilityExist = p1AuthNodes?.some(n => n.data.capabilityName === 'returnCibaSuccess');
                    //Both returnCibaError and returnCibaSuccess are required for CIBA flow response, if any of them is missing then throw error.
                    if ((!cibaErrorCapabilityExist || !cibaSuccessCapabilityExist)) {
                        this.addError("dv-er-ciba-flow-001", {
                            flowId: flow.flowId,
                        });
                    }

                    // Second Rule:  logic for flowConductorConnector capabilities
                    const flowNodes = nodes?.filter(n => n.data.connectorId === 'flowConnector' && n.data?.isDisabled !== true);
                    const oobStartCapabilityExist = flowNodes?.some(n => n.data.capabilityName === 'oobStart');
                    const oobContinueCapabilityExist = flowNodes?.some(n => n.data.capabilityName === 'oobContinue');
                    //Both oobStart and oobContinue are required for CIBA flow execution, if any of them is missing then throw error.

                    if ((!oobStartCapabilityExist || !oobContinueCapabilityExist)) {
                        this.addError("dv-er-ciba-flow-002", {
                            flowId: flow.flowId,
                        });
                    }

                    // Third Rule:  logic for validating that CIBA response nodes are not present in subflows
                    if(flow.flowId !== targetFlow.flowId){
                        //Both returnCibaError and returnCibaSuccess  should not be present in Subflows
                        if ((cibaErrorCapabilityExist || cibaSuccessCapabilityExist)) {
                            const flowConnectorNode= mainFlowNodes.filter(n=>n?.data?.properties?.subFlowId?.value?.value === flow.flowId)
                            this.addError("dv-er-ciba-flow-003", {
                                flowId: targetFlow.flowId,
                                nodeId: flowConnectorNode[0].data.id,
                                recommendationArgs: [`${flow.name}`],
                            });
                        }
                    }
                }
            }
        } catch(err) {
            this.addError(undefined, { messageArgs: [`${err}`] });
        }
    }
}

module.exports = CibaFlowRule;
