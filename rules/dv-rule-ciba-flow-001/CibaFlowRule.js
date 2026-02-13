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

    }

    runRule() {

        try {

        const targetFlow = this.mainFlow;
        const isP1CibaFlow = targetFlow?.settings?.pingOneFlow && targetFlow?.settings?.cibaFlow ;
        let responseNodeErrorAdded = false;
        let executionNodeErrorAdded = false;
        
        //These rules apply only for Pingone CIBA Flows
        if(isP1CibaFlow){
            for (const flow of this.allFlows) {
                
                const { nodes } = flow?.graphData?.elements;

                // Rule logic for pingOneAuthenticationConnector capabilities
                const p1AuthNodes = nodes?.filter(n => n.data.connectorId === 'pingOneAuthenticationConnector' && n.data?.isDisabled !== true);

                const cibaErrorCapabilityExist = p1AuthNodes?.some(n => n.data.capabilityName === 'returnCibaError');
                const cibaSuccessCapabilityExist = p1AuthNodes?.some(n => n.data.capabilityName === 'returnCibaSuccess');
                //Both returnCibaError and returnCibaSuccess are required for CIBA flow response, if any of them is missing then throw error.
                if ((!cibaErrorCapabilityExist || !cibaSuccessCapabilityExist) && !responseNodeErrorAdded) {
                    responseNodeErrorAdded = true; // Dont add this error twice
                    this.addError("dv-er-ciba-flow-001", {
                        flowId: flow.flowId,
                    });
                }

                // Rule logic for flowConductorConnector capabilities
                const flowNodes = nodes?.filter(n => n.data.connectorId === 'flowConnector' && n.data?.isDisabled !== true);

                const oobStartCapabilityExist = flowNodes?.some(n => n.data.capabilityName === 'oobStart');
                const oobContinueCapabilityExist = flowNodes?.some(n => n.data.capabilityName === 'oobContinue');
                //Both oobStart and oobContinue are required for CIBA flow execution, if any of them is missing then throw error.
                if ((!oobStartCapabilityExist || !oobContinueCapabilityExist) && !executionNodeErrorAdded) {
                    executionNodeErrorAdded = true; // Dont add this error twice
                    this.addError("dv-er-ciba-flow-002", {
                        flowId: flow.flowId,
                    });
                }
                
            }
        }

        } catch(err) {
            this.addError(undefined, { messageArgs: [`${err}`] });
        }
    }

}

module.exports = CibaFlowRule;
