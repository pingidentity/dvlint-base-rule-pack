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
            recommendation: "Use global variables cautiously in custom code. Avoid storing or processing sensitive information within them.",
        });
        this.addCode("dv-bp-globalVariable-002", {
            description: "Global variable usage in Custom Function code",
            message: "Global variable usage in Custom Function code",
            type: "best-practice",
            recommendation: "Use global variables cautiously in custom code. Avoid storing or processing sensitive information within them.",
        });
        this.addCode("dv-bp-globalVariable-003", {
            description: "Custom JavaScript usage in flow",
            message: "Custom JavaScript usage in flow",
            type: "best-practice",
            recommendation: "Review the script in the % to ensure it does not introduce security vulnerabilities.%",
        });

    }

    getPropertiesValue(value, pattern) {
        const strVal = JSON.stringify(value) || '';
        const matches = [...strVal.matchAll(pattern)];
        const localVarArray = matches.map(match => match[1]);
        const uniqueGlobalVariables = [...new Set(localVarArray)];
        return uniqueGlobalVariables;
    }

    runRule() {
        try {
            const connectorIdsForGlobalVariableCheck = {
                transunionConnector: {
                    otpAuthentication: 'htmlConfig_questionsScreen',
                    kba: 'htmlConfig_questionsScreen',
                    otpVerification: 'htmlConfig_questionsScreen',
                    documentVerification: 'htmlConfig_docVerificationConsentScreen'
                },
                userPolicyConnector: {
                    authenticateUser: ['htmlConfig_htmlLogin1', 'htmlConfig_htmlLogin2']
                },
                idemiaConnector: {
                    documentVerification: [
                        'htmlConfig_docVerificationDocumentTypeSelectScreen',
                        'htmlConfig_docVerificationConnectivityCheck',
                        'htmlConfig_docVerificationDocCapture',
                        'htmlConfig_docVerificationCountrySelectScreen',
                        'htmlConfig_docVerificationFrontScanTutorial'
                    ],
                    portraitVerification: [
                        'htmlConfig_portraitVerificationCheckBrowserSupport',
                        'htmlConfig_portraitVerificationPortraitCapture'
                    ]
                },
                jumioConnector: {
                    register: ['htmlConfig_documentVerify3', 'htmlConfig_documentVerify2'],
                    documentVerify: 'htmlConfig_documentVerify3',
                    login: 'htmlConfig_login2',
                    loginFirstFactor: ['htmlConfig_loginFirstFactor1', 'htmlConfig_loginFirstFactor2']
                },
                nuanceConnector: {
                    register: ['htmlConfig_htmlRegister1', 'htmlConfig_htmlRegister2'],
                    login: ['htmlConfig_htmlLogin1', 'htmlConfig_htmlLogin2']
                },
                pingFederateConnectorV2: {
                    authenticate: ''
                },
                mfaContainerConnector: {
                    login: '',
                    loginDynamicMethods: '',
                    register: ''
                },
                entrustConnector: {
                    auth: 'htmlConfig0_select'
                },
                securIdConnector: {
                    verifyRSA: ['htmlConfig0_selectScreen', 'htmlConfig1_authenticateTokenCode', 'htmlConfig2_emergencyTokenCode']
                },
                lexisnexisV2Connector: {
                    initialize: 'htmlConfig_initializeScreen',
                    otp: 'htmlConfig_OTPscreen',
                    iidqa: 'htmlConfig_questionsScreen2'
                }
            }


            const connectorIdWithKeyBeforeCustomScript = [
                'transunionConnector', 'userPolicyConnector',
                'idemiaConnector', 'jumioConnector',
                'nuanceConnector', 'entrustConnector',
                'lexisnexisV2Connector', 'securIdConnector'
            ];
            const connectorIdWithoutKeyBeforeCustomScript = ['pingFederateConnectorV2', 'mfaContainerConnector'];
            const pattern = /\{\{(.*?)\}\}/g; // regex pattern to match all instances of {{...}}
            for (const flow of this.allFlows) {
                const { nodes, edges } = flow?.graphData?.elements
                nodes?.forEach((node) => {
                    const { data } = node;
                    if (data.nodeType === "CONNECTION" && data.capabilityName === "customHTMLTemplate" || data.capabilityName === "customFunction") {
                        let property = data.capabilityName === "customFunction" ? "code" : "customScript";
                        let value = data.properties[property]?.value;
                        const uniqueGlobalVariables = this.getPropertiesValue(value, pattern);
                        const globalVarArr = []
                        uniqueGlobalVariables?.forEach(v => {
                            if (v.includes('global.')) {
                                globalVarArr.push(`{{${v}}}`)
                            }
                        });
                        if (globalVarArr.length > 0) {
                            let ruleNo = data.capabilityName === "customFunction" ? "dv-bp-globalVariable-002" : "dv-bp-globalVariable-001";
                            this.addError(ruleNo, {
                                flowId: this.mainFlow.flowId,
                                nodeId: node.data.id
                            });
                        }
                    }

                    if (
                        data.nodeType === "CONNECTION" &&
                        (data.connectorId in connectorIdsForGlobalVariableCheck) &&
                        data.capabilityName in connectorIdsForGlobalVariableCheck[data.connectorId]
                    ) {
                        let value;
                        if (connectorIdWithKeyBeforeCustomScript.includes(data.connectorId)) {
                            const key = connectorIdsForGlobalVariableCheck[data.connectorId][data.capabilityName];
                            // this case is for capabilities where multiple code snippet sections are available in custom screens
                            if (Array.isArray(key) && key.length > 0) {
                                const globalVarArr = []
                                key.forEach(k => {
                                    const propValue = data.properties[k]?.properties?.customScript?.value;
                                    if (propValue) {
                                        const uniqueGlobalVariables = this.getPropertiesValue(propValue, pattern)
                                        uniqueGlobalVariables?.forEach(v => {
                                            if (v.includes('global.')) {
                                                globalVarArr.push(`{{${v}}}`)
                                            }
                                        });
                                    }
                                });
                                if (globalVarArr.length > 0) {
                                    this.addError("dv-bp-globalVariable-003", {
                                        flowId: this.mainFlow.flowId,
                                        nodeId: node.data.id,
                                        recommendationArgs: [`'${data.capabilityName}' capability`, '']
                                    });
                                }
                            } else {
                                value = data.properties[key]?.properties?.customScript?.value;
                            }

                        } else if (connectorIdWithoutKeyBeforeCustomScript.includes(data.connectorId)) {
                            value = data.properties?.customScript?.value;
                        }

                        const uniqueGlobalVariables = this.getPropertiesValue(value, pattern)
                        const globalVarArr = []
                        uniqueGlobalVariables?.forEach(v => {
                            if (v.includes('global.')) {
                                globalVarArr.push(`{{${v}}}`)
                            }
                        });
                        if (globalVarArr.length > 0) {
                            this.addError("dv-bp-globalVariable-003", {
                                flowId: this.mainFlow.flowId,
                                nodeId: node.data.id,
                                recommendationArgs: [`'${data.capabilityName}' capability`, '']
                            });
                        }
                    }
                });


                // configuration code check
                const connectorIdsForConfigurationCheck = ['codeSnippetConnector'];
                connectorIdsForConfigurationCheck.forEach(connectorId => {
                    const codeSnippetConnectorNodeids = nodes?.filter(node => node.data.connectorId === connectorId).map(node => node.data.id);
                    flow.connections?.forEach((connection) => {
                        if (connection?.connectorId === connectorId) {
                            const value = connection?.properties?.code?.value;
                            const uniqueGlobalVariables = this.getPropertiesValue(value, pattern);
                            const globalVarArr = []
                            uniqueGlobalVariables?.forEach(v => {
                                // Check if the configurations code section has global variable
                                if (v.includes('global.')) {
                                    globalVarArr.push(`{{${v}}}`)
                                }
                            });
                            if (globalVarArr.length > 0) {
                                this.addError("dv-bp-globalVariable-003", {
                                    flowId: this.mainFlow.flowId,
                                    recommendationArgs: [`'${connectorId}' connector`, `This connector is used in the following node(s): ${codeSnippetConnectorNodeids.join(',')}.`],
                                });
                            }
                        }
                    })
                })
            }
        } catch (err) {
            this.addError(undefined, { messageArgs: [`${err}`] });
        }
    }
}

module.exports = GlobalVariableRule;
