const { LintRule } = require("@ping-identity/dvlint");

class GlobalVariableRule extends LintRule {
    constructor() {
        super({
            id: "dv-rule-globalVariable-001",
            description: "Global variable usage in script",
            cleans: false,
            reference: "",
        });

        this.addCode("dv-bp-globalVariable-001", {
            description: "Global variable usage in Custom HTML Template script",
            message: "Global variable usage in Custom HTML Template script",
            type: "best-practice",
            recommendation: "Use global variables '%' cautiously in custom code. Avoid storing or processing sensitive information within them.",
        });
        this.addCode("dv-bp-globalVariable-002", {
            description: "Global variable usage in Custom Function code",
            message: "Global variable usage in Custom Function code",
            type: "best-practice",
            recommendation: "Use global variables cautiously in custom code. Avoid storing or processing sensitive information within them.",
        });

    }

    runRule() {
        try {
            for (const flow of this.allFlows) {
                const { nodes, edges } = flow?.graphData?.elements
                const multiValueSourceId = edges?.filter(edge => edge.data.multiValueSourceId).map(ed => ed.data.multiValueSourceId) || [];

                nodes?.forEach((node) => {
                    const { data } = node;

                    if (data.nodeType === "CONNECTION" && data.capabilityName === "customHTMLTemplate" || data.capabilityName === "customFunction") {
                        let property = data.capabilityName === "customFunction" ? "code" : "customScript";
                        let value = data.properties[property]?.value;
                        const pattern = /\{\{(.*?)\}\}/g; // regex pattern to match all instances of {{...}}
                        const strVal = JSON.stringify(value) || '';
                        const matches = [...strVal.matchAll(pattern)];
                        const localVarArray = matches.map(match => match[1]);
                        const uniqueGlobalVariables = [...new Set(localVarArray)];

                        uniqueGlobalVariables?.forEach(v => {
                            //check undefined variables
                            if (v.includes('global.')) {
                                let ruleNo = data.capabilityName === "customFunction" ? "dv-bp-globalVariable-002" : "dv-bp-globalVariable-001";
                                this.addError(ruleNo, {
                                    flowId: this.mainFlow.flowId,
                                    recommendationArgs: [`{{${v}}}`], //make it comma separated variable
                                    nodeId: node.data.id
                                });
                            }
                        });
                    }

                });
            }
        } catch (err) {
            this.addError(undefined, { messageArgs: [`${err}`] });
        }
    }
}

module.exports = GlobalVariableRule;
