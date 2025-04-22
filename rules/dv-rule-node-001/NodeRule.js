const { LintRule } = require("@ping-identity/dvlint");

const backgroundColor = {
  httpConnector_createSuccessResponse: "#9dc967",
  httpConnector_createErrorResponse: "#ffc8c1",
};

class NodeRule extends LintRule {
  constructor() {
    super({
      id: "dv-rule-node-001",
      description: "Ensure nodes have names/titles",
      cleans: false,
      reference: "",
    });

    this.addCode("dv-bp-node-001", {
      description: "All nodes should have a title",
      message: "Missing node title",
      type: "best-practice",
      recommendation: "The (% %) node is missing a title. For optimal clarity, add a descriptive title.",
    });
    this.addCode("dv-bp-node-002", {
      description: "All success/error JSON nodes should proper colors",
      message: "Incorrect node color",
      type: "best-practice",
      recommendation: "The (% %) is not using the correct color. To ensure consistency, use the recommended color: [%].",
    });
    this.addCode("dv-bp-node-003", {
      description: "All nodes should have a description",
      message: "Missing node description",
      type: "best-practice",
      recommendation: "The (% %) node is missing a description. For optimal clarity, add a meaningful description.",
    });
    this.addCode("dv-er-node-004", {
      description: "Form not selected",
      message: "Form not selected",
      type: "error",
      recommendation: "A form is not selected in the <%> connector. Select a form to complete the configuration.",
    });
    this.addCode("dv-er-node-005", {
      description: '"Expire Flow Instance Cache" enabled in an intermediate node',
      message: '"Expire Flow Instance Cache" enabled in an intermediate node',
      type: "error",
      recommendation: "This setting should only be used on flow-ending nodes. Disable it on intermediate node <nodeId> to prevent execution issues.",
    });
    this.addCode("dv-er-node-006", {
      description: 'Missing site key configuration for reCAPTCHA',
      message: 'Missing site key configuration for reCAPTCHA',
      type: "error",
      recommendation: "Configure the required site key value to enable proper reCAPTCHA functionality.",
    });

    this.addCode("dv-er-node-007", {
      description: "Incorrect 'Additional Fields in the Response' in Send Success JSON Response capability",
      message: "Incorrect 'Additional Fields in the Response' in Send Success JSON Response capability",
      type: "error",
      recommendation: "Ensure valid key/value pairs are configured under 'Additional Fields in the Response'.",
    });

    this.addCode("dv-er-node-008", {
      description: "Incorrect 'Additional Fields in the Response' in Send Error JSON Response capability",
      message: "Incorrect 'Additional Fields in the Response' in Send Error JSON Response capability",
      type: "error",
      recommendation: "Ensure valid key/value pairs are configured under 'Additional Fields in the Response'.",
    });
    this.addCode("dv-bp-node-009", {
      description: "Global variable usage in Custom HTML Template script",
      message: "Global variable usage in Custom HTML Template script",
      type: "best-practice",
      recommendation: "Use global variables '%' cautiously in custom code. Avoid storing or processing sensitive information within them.",
    });
    this.addCode("dv-bp-node-010", {
      description: "Global variable usage in Custom Function code",
      message: "Global variable usage in Custom Function code",
      type: "best-practice",
      recommendation: "Use global variables cautiously in custom code. Avoid storing or processing sensitive information within them.",
    });
    this.addCode("dv-er-node-011", {
      description: "Missing 'Property Name' for Output Fields in Custom HTML Template capability",
      message: "Missing 'Property Name' for Output Fields in Custom HTML Template capability",
      type: "error",
      recommendation: "Add a 'Property Name' to define the purpose of the output field. This property can then be referenced by successive nodes in the flow.",
    });
    this.addCode("dv-er-node-012", {
      description: "Invalid configurations for 'A == B (Multiple Conditions)' capability",
      message: "Invalid configurations for 'A == B (Multiple Conditions)' capability",
      type: "error",
      recommendation: "Define at least one expected outcome values for the 'A == B (Multiple Conditions)' capability to ensure correct flow branching.",
    });
    this.addCode("dv-bp-node-013", {
      description: "Invalid output mapping for 'A == B (Multiple Conditions)' capability",
      message: "Invalid output mapping for 'A == B (Multiple Conditions)' capability",
      type: "best-practice",
      recommendation: "Map each specific outcome value from 'A == B (Multiple Conditions)' to the next node. Do not use generic node-level output.",
    });
    this.addCode("dv-er-node-014", {
      description: "Unmapped outcome(s) in 'A == B (Multiple Conditions)' capability",
      message: "Unmapped outcome(s) in 'A == B (Multiple Conditions)' capability",
      type: "error",
      recommendation: "Map the outcome ‘%’ to an appropriate next node in the ‘A == B (Multiple Conditions)’ capability.",
    });
  }

  runRule() {
    try {
      const ignoreNodeTypes = ["nodeConnector", "functionsConnector"];
      for (const flow of this.allFlows) {
        const { nodes, edges } = flow?.graphData?.elements
        const nodeSourceMap = edges?.map(edge => edge.data.source) || [];
        const multiValueSourceId = edges?.filter(edge => edge.data.multiValueSourceId).map(ed => ed.data.multiValueSourceId) || [];

        nodes?.forEach((node) => {
          const { data } = node;

          // Check for node title
          if (
            data.nodeType === "CONNECTION" &&
            !(data.capabilityName === 'goToNode' || data.capabilityName === 'returnBackToCallingNode') &&
            !data.properties?.nodeTitle?.value
          ) {
            this.addError("dv-bp-node-001", {
              flowId: flow.flowId,
              recommendationArgs: [data.id, data.name],
              nodeId: data.id,
            });
          }

          // Check for node description
          if (
            !ignoreNodeTypes.includes(data.connectorId) &&
            data.nodeType === "CONNECTION" &&
            !data.properties?.nodeDescription?.value
          ) {
            this.addError("dv-bp-node-003", {
              flowId: flow.flowId,
              recommendationArgs: [data.id, data.name],
              nodeId: data.id,
            });
          }

          // Check for Success/Error JSON background colors
          const connectorCapability = `${data.connectorId}_${data.capabilityName}`;
          if (
            Object.keys(backgroundColor).find(
              (o) => o === `${connectorCapability}`
            )
          ) {
            if (
              !data.properties?.backgroundColor?.value
                .toLowerCase()
                .startsWith(backgroundColor[connectorCapability])
            ) {
              this.addError("dv-bp-node-002", {
                flowId: flow.flowId,
                recommendationArgs: [data.id, data.name, backgroundColor[connectorCapability]],
                nodeId: data.id,
              });
            }
          }

          //check for form selection (connectorId:pingOneFormsConnector)
          if (
            data.nodeType === "CONNECTION" &&
            data.connectorId === "pingOneFormsConnector" &&
            data.capabilityName === "customForm" &&
            !data.properties?.form?.value
          ) {
            this.addError("dv-er-node-004", {
              flowId: flow.flowId,
              recommendationArgs: [data.id],
              nodeId: data.id,
            });
          }

          //check if Expire Flow Instance Cache enabled in an intermediate node
          if (data.nodeType === "CONNECTION" && data.properties?.oeInteractionCacheExpire?.value && nodeSourceMap.includes(data.id)) {
            this.addError("dv-er-node-005", {
              flowId: flow.flowId,
              recommendationArgs: [data.id],
              nodeId: data.id,
            });
          }

          //check if skrecpatcha in custom HTMLTemplate or customHtmlMessage is properly configured
          if (data.nodeType === "CONNECTION" && (data.capabilityName === "customHTMLTemplate" || data.capabilityName === "customHtmlMessage")) {
            let content = data.properties?.message?.value || data.properties?.customHTML?.value || "[]";
            if (content.indexOf('skrecaptcha') > -1) {
              let message = JSON.parse(content);
              const value = message[0]?.children?.filter(d => d.component === 'skrecaptcha' && d.options);
              if (value.length > 0 && !value[0]?.options?.siteKey) {
                this.addError("dv-er-node-006", {
                  flowId: flow.flowId,
                  recommendationArgs: [data.id],
                  nodeId: data.id,
                });
              }
            }
          }

          //check 'A == B (Multiple Conditions)' capability(Functions)  has atleast one expected outcome value
          if (data.nodeType === "CONNECTION" && (data.capabilityName === "AEqualsMultipleB")) {
            let leftValueA = data.properties?.leftValueA?.value;
            let rightMultipleValuesArr = data.properties?.rightValueMultiple?.value || [];
            if (leftValueA && rightMultipleValuesArr.length === 0) {
              this.addError("dv-er-node-012", {
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
              this.addError("dv-er-node-014", {
                flowId: flow.flowId,
                nodeId: data.id,
                recommendationArgs: [missingConditionNames.join(',')]
              });
            }

            //check 'A == B (Multiple Conditions)' capability(Functions) node has any node connected to main node, other than the conditon nodes
            let nonConditionEvalNodeArr = edges?.filter(edge => edge.data.source === data.id && !edge?.data.multiValueSourceId);
            if (nonConditionEvalNodeArr.length > 0) {
              let nonConditionEvalNode = nonConditionEvalNodeArr[0].data.target;
              let nonConditonConnectorNodeId = edges?.filter(edge => edge.data.source === nonConditionEvalNode)[0].data.target;
              const connectorNode = nodes?.filter(node => node.data.id === nonConditonConnectorNodeId);
              this.addError("dv-bp-node-013", {
                flowId: flow.flowId,
                nodeId: connectorNode[0].data.id,
              });
            }
           
          }

          //check if claimsNameValuePairs in  createErrorResponse or createSuccessResponse is properly configured
          if (data.nodeType === "CONNECTION" && (data.capabilityName === "createErrorResponse" || data.capabilityName === "createSuccessResponse")) {
            let value = data.properties?.claimsNameValuePairs?.value || [];
            const noValFlag = value?.filter(v => !v.value || !JSON.parse(v.value)[0].children[0].text).length > 0;
            const errorCode = data.capabilityName === "createErrorResponse" ? "dv-er-node-008" : "dv-er-node-007";
            if (!value || noValFlag) {
              this.addError(errorCode, {
                flowId: flow.flowId,
                nodeId: data.id,
              });
            }
          }


          //check if customHTMLTemplate(HTTP) or customFunction(Functions) has global variables
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
                let ruleNo = data.capabilityName === "customFunction" ? "dv-bp-node-010" : "dv-bp-node-009";
                this.addError(ruleNo, {
                  flowId: this.mainFlow.flowId,
                  recommendationArgs: [`{{${v}}}`], //make it comma separated variable
                  nodeId: node.data.id
                });
              }
            });


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
                this.addError("dv-er-node-011", {
                  flowId: this.mainFlow.flowId,
                  recommendationArgs: [emptyProperty.join(',')],
                  nodeId: data.id,
                });
              }
            }

          }
        });
      }
    } catch (err) {
      this.addError(undefined, { messageArgs: [`${err}`] });
    }
  }
}

module.exports = NodeRule;
