const { LintRule } = require("@ping-identity/dvlint");

class AEqualsBMultipleConditionRule extends LintRule {
    constructor() {
        super({
            id: "dv-rule-AEqualsBMultipleCondition-001",
            description: "Invalid configurations for 'A == B (Multiple Conditions)' capability",
            cleans: false,
            reference: "",
        });

        this.addCode("dv-er-AEqualsBMultipleCondition-001", {
            description: "Invalid configurations for 'A == B (Multiple Conditions)' capability",
            message: "Invalid configurations for 'A == B (Multiple Conditions)' capability",
            type: "error",
            recommendation: "Define at least one expected outcome values for the 'A == B (Multiple Conditions)' capability to ensure correct flow branching.",
        });
        this.addCode("dv-bp-AEqualsBMultipleCondition-002", {
            description: "Invalid output mapping for 'A == B (Multiple Conditions)' capability",
            message: "Invalid output mapping for 'A == B (Multiple Conditions)' capability",
            type: "best-practice",
            recommendation: "Map each specific outcome value from 'A == B (Multiple Conditions)' to the next node. Do not use generic node-level output.",
        });
        this.addCode("dv-bp-AEqualsBMultipleCondition-003", {
            description: "Unmapped outcome(s) in 'A == B (Multiple Conditions)' capability",
            message: "Unmapped outcome(s) in 'A == B (Multiple Conditions)' capability",
            type: "best-practice",
            recommendation: "Map the % % to an appropriate next node in the 'A == B (Multiple Conditions)' capability.",
        });

    }

    runRule() {
        try {
            for (const flow of this.allFlows) {
                const { nodes, edges } = flow?.graphData?.elements
                const multiValueSourceId = edges?.filter(edge => edge.data.multiValueSourceId).map(ed => ed.data.multiValueSourceId) || [];

                nodes?.forEach((node) => {
                    const { data } = node;
                    //check 'A == B (Multiple Conditions)' capability(Functions)  has atleast one expected outcome value
                    if (data.nodeType === "CONNECTION" && (data.capabilityName === "AEqualsMultipleB")) {
                        let leftValueA = data.properties?.leftValueA?.value;
                        let rightMultipleValuesArr = data.properties?.rightValueMultiple?.value || [];
                        if (leftValueA && rightMultipleValuesArr.length === 0) {
                            this.addError("dv-er-AEqualsBMultipleCondition-001", {
                                flowId: flow.flowId,
                                nodeId: data.id,
                            });
                        }

                        //check if 'A == B (Multiple Conditions)' conditions  is properly configured
                        let missingConditionNames = [];
                        rightMultipleValuesArr?.forEach((rightValue) => {
                            if (rightValue.id && !multiValueSourceId.includes(rightValue.id)) {
                                let conditionName = JSON.parse(rightValue.value)[0].children[0].text
                                missingConditionNames.push(conditionName);
                            }
                        })
                        if (missingConditionNames.length > 0) {
                            const outCompleSingularOrPlural = missingConditionNames.length === 1 ? 'outcome' : 'outcomes'
                            const stringWithQuotesCommaSeparated = missingConditionNames.map(str => `'${str}'`).join(', ');
                            this.addError("dv-bp-AEqualsBMultipleCondition-003", {
                                flowId: flow.flowId,
                                nodeId: data.id,
                                recommendationArgs: [outCompleSingularOrPlural, stringWithQuotesCommaSeparated]
                            });
                        }

                        //check 'A == B (Multiple Conditions)' capability(Functions) node has any node connected to main node, other than the conditon nodes
                        let nonConditionEvalNodeArr = edges?.filter(edge => edge.data.source === data.id && !edge?.data.multiValueSourceId);
                        if (nonConditionEvalNodeArr?.length > 0) {
                            // let nonConditionEvalNode = nonConditionEvalNodeArr[0].data.target;
                            // let nonConditonConnectorNodeId = edges?.filter(edge => edge.data.source === nonConditionEvalNode)[0].data.target;
                            // const connectorNode = nodes?.filter(node => node.data.id === nonConditonConnectorNodeId);
                            this.addError("dv-bp-AEqualsBMultipleCondition-002", {
                                flowId: flow.flowId,
                                nodeId: node.data.id,
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

module.exports = AEqualsBMultipleConditionRule;
