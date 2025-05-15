const { LintRule } = require("@ping-identity/dvlint");

class ValidFields extends LintRule {
    constructor() {
        super({
            id: "dv-rule-validFields-001",
            description: "Missing or Incorrect fields in nodes",
            cleans: false,
            reference: "",
        });

        this.addCode("dv-er-validFields-001", {
            description: 'Missing site key configuration for reCAPTCHA',
            message: 'Missing site key configuration for reCAPTCHA',
            type: "error",
            recommendation: "Configure the required site key value to enable proper reCAPTCHA functionality.",
        });

        this.addCode("dv-er-validFields-002", {
            description: "Incorrect 'Additional Fields in the Response' in Send Success JSON Response capability",
            message: "Incorrect 'Additional Fields in the Response' in Send Success JSON Response capability",
            type: "error",
            recommendation: "Ensure valid key/value pairs are configured under 'Additional Fields in the Response'.",
        });

        this.addCode("dv-er-validFields-003", {
            description: "Incorrect 'Additional Fields in the Response' in Send Error JSON Response capability",
            message: "Incorrect 'Additional Fields in the Response' in Send Error JSON Response capability",
            type: "error",
            recommendation: "Ensure valid key/value pairs are configured under 'Additional Fields in the Response'.",
        });

        this.addCode("dv-er-validFields-004", {
            description: "Missing 'Property Name' for Output Fields in Custom HTML Template capability",
            message: "Missing 'Property Name' for Output Fields in Custom HTML Template capability",
            type: "error",
            recommendation: "Add a 'Property Name' to define the purpose of the output field. This property can then be referenced by successive nodes in the flow.",
        });

    }

    runRule() {
        try {
            for (const flow of this.allFlows) {
                const { nodes, edges } = flow?.graphData?.elements
                nodes?.forEach((node) => {
                    const { data } = node;

                    //check if skrecpatcha in custom HTMLTemplate or customHtmlMessage is properly configured
                    if (data.nodeType === "CONNECTION" && (data.capabilityName === "customHTMLTemplate" || data.capabilityName === "customHtmlMessage")) {
                        let content = data.properties?.message?.value || data.properties?.customHTML?.value || "[]";
                        if (content.indexOf('skrecaptcha') > -1) {
                            let message = JSON.parse(content);
                            const value = message[0]?.children?.filter(d => d.component === 'skrecaptcha' && d.options);
                            if (value.length > 0 && !value[0]?.options?.siteKey) {
                                this.addError("dv-er-validFields-001", {
                                    flowId: flow.flowId,
                                    recommendationArgs: [data.id],
                                    nodeId: data.id,
                                });
                            }
                        }

                        if (data.capabilityName === "customHTMLTemplate") {
                            //check if output field propertyName field has no value
                            let formFieldsListArr = data.properties?.formFieldsList?.value;
                            let emptyProperty = []
                            formFieldsListArr?.forEach((formField) => {
                                if (!formField.propertyName) {
                                    emptyProperty.push(formField?.preferredControlType);
                                }
                            });

                            if (emptyProperty.length > 0) {
                                this.addError("dv-er-validFields-004", {
                                    flowId: this.mainFlow.flowId,
                                    recommendationArgs: [emptyProperty.join(',')],
                                    nodeId: data.id,
                                });
                            }
                        }
                    }

                    //check if claimsNameValuePairs in  createErrorResponse or createSuccessResponse is properly configured
                    if (data.nodeType === "CONNECTION" && (data.capabilityName === "createErrorResponse" || data.capabilityName === "createSuccessResponse")) {
                        let value = data.properties?.claimsNameValuePairs?.value || [];

                        let errorArr = []

                        value?.map(v => {
                            if (!v.value) {
                                errorArr.push(v);
                            }
                            let valInChild = JSON.parse(v.value)[0].children;
                            let isValAvailable
                            if (valInChild.length > 1) {
                                isValAvailable = valInChild.filter(val => val.data);
                            } else {
                                isValAvailable = valInChild[0].text
                            }
                            if (!isValAvailable) {
                                errorArr.push(v);
                            }
                        });

                        const errorCode = data.capabilityName === "createErrorResponse" ? "dv-er-validFields-003" : "dv-er-validFields-002";
                        if (!value || errorArr.length > 0) {
                            this.addError(errorCode, {
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

module.exports = ValidFields;
