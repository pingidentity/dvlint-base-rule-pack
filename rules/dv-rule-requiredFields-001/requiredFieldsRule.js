const { LintRule } = require("@ping-identity/dvlint");

class RequiredFieldsRule extends LintRule {
    constructor() {
        super({
            id: "dv-rule-requiredFields-001",
            description: "Missing required value",
            cleans: false,
            reference: "",
        });
        this.addCode("dv-er-requiredFields-001", {
            description: "Missing required value",
            message: "Missing required value",
            type: "error",
            recommendation: "Configure a value for % in the % capability in % connector"
        });
    }

    runRule() {
        try {
            const targetFlow = this.mainFlow;
            const { nodes } = targetFlow?.graphData?.elements;
            nodes?.forEach((node) => {
                const properties = node.data.properties || {};
                const requiredFieldArr = node.data.capabilityConfigRequiredProperties || [];
                const capabilityConfigRequiredProperties = requiredFieldArr?.map(field => field.requiredField);
                const noFieldsValueArr = []
                if (node.data.nodeType === 'CONNECTION' && capabilityConfigRequiredProperties?.length) {
                    for (const property of capabilityConfigRequiredProperties) {
                        if (!(property in properties) || !properties[property]?.value) {
                            const fieldName = requiredFieldArr?.filter(field => field.requiredField === property)[0].requiredFieldTitle
                            noFieldsValueArr.push(fieldName);
                        }
                    }
                    if (noFieldsValueArr.length > 0) {
                        const connectorName = node.data.connectorName || node.data.connectorId;
                        const connectorTitle = node.data.title || node.data.capabilityName;
                        const fieldStr = noFieldsValueArr.map(str => `'${str}'`).join(', ');
                        const fieldNameText = noFieldsValueArr.length > 1 ? `${fieldStr} fields` : `${fieldStr} field`
                        this.addError("dv-er-requiredFields-001", {
                            flowId: this.mainFlow.flowId,
                            nodeId: node.data.id,
                            recommendationArgs: [fieldNameText, connectorTitle, connectorName],
                        });
                    }
                }
            })

        } catch (err) {
            this.addError(undefined, { messageArgs: [`${err}`] });
        }
    }
}

module.exports = RequiredFieldsRule;
