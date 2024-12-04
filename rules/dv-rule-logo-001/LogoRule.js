const { LintRule } = require("@ping-identity/dvlint");

class LogoRule extends LintRule {
  constructor() {
    super({
      id: "dv-rule-logo-001",
      description:
        "Ensure logos are not hard coded and useCSS is used with a css logo tag.  Does not apply to subflows",
      cleans: false,
      reference: "https://library.pingidentity.com/page/ping-ux-css",
    });

    this.addCode("dv-bp-logo-001", {
      description: "In flow settings, useCustomCSS not set to true",
      message: "useCustomCSS not set to true",
      type: "best-practice",
      recommendation: "Use the recommended CSS settings for flows developed by Ping to ensure consistency."
    });
    this.addCode("dv-bp-logo-002", {
      description:
        "In flow settings, companyLogo class not included in custom CSS",
      message: "companyLogo class not included in custom CSS",
      type: "best-practice",
      recommendation: "Use the recommended CSS settings for flows developed by Ping to ensure consistency."
    });
    this.addCode("dv-bp-logo-003", {
      description:
        "Didn't find companyLogo environment variable in variables connector, this variable should be present in the flow.",
      message: "companyLogo environment variable not found. (% - %)",
      type: "best-practice",
      recommendation: "Use the companyLogo environment variable for Ping-developed flows to ensure the correct branding.",
    });
    this.addCode("dv-bp-logo-004", {
      description:
        "Didn't find companyName environment variable in variables connector, this variable should be present in the flow.",
      message: "companyName environment variable not found. (% - %)",
      type: "best-practice",
      recommendation: "Use the companyName environment variable for Ping-developed flows to display the appropriate company name.",
    });
  }

  runRule() {
    try {
      const dvFlow = this.mainFlow;
      const { allFlows } = this;

      // Ignore this rule in subflows, CSS should be applied at the main flow level
      if (this.dvUtil.getAllSubFlows(allFlows).includes(dvFlow.flowId)) {
        return;
      }
      // Check for custom CSS enabled
      if (!dvFlow.settings?.useCustomCSS) {
        this.addError("dv-bp-logo-001");
      }
      // Check for companyLogo class in custom CSS
      if (!dvFlow.settings?.css?.includes(".companyLogo")) {
        this.addError("dv-bp-logo-002");
      }

      for (const flow of this.allFlows) {
        let companyLogoFound = false;
        let companyNameFound = false;

        // Search for companyLogo and companyName environment variables
        (flow.graphData?.elements?.nodes || []).some((node) => {
          const { data } = node;

          if (data.connectorId === "variablesConnector") {
            const saveVariables = data.properties?.saveVariables?.value;
            if (saveVariables) {
              companyLogoFound = saveVariables.some((obj) => obj.name === "companyLogo");
              companyNameFound = saveVariables.some((obj) => obj.name === "companyName");

              // If both variables are found, break out of the loop
              return companyLogoFound && companyNameFound;
            }
          }
          return false; // Not found, continue searching
        });

        if (!companyLogoFound) {
          this.addError("dv-bp-logo-003", {
            flowId: flow.flowId,
            messageArgs: ["Flow Id", flow.flowId]
          });
        }

        if (!companyNameFound) {
          this.addError("dv-bp-logo-004", {
            flowId: flow.flowId,
            messageArgs: ["Flow Id", flow.flowId]
          });
        }
      }
    } catch (err) {
      this.addError(undefined, { messageArgs: [`${err}`] });
    }
  }
}

module.exports = LogoRule;
