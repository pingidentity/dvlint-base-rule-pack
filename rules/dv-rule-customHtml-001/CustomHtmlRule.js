const { LintRule } = require("@ping-identity/dvlint");

class CustomHtmlRule extends LintRule {
  constructor() {
    super({
      id: "dv-rule-customHtml-001",
      description:
        "Detect duplicate element ids in custom HTML across nodes",
      cleans: false,
      reference: "",
    });

    this.addCode("dv-bp-customHtml-001", {
      description: "Duplicate element ids across custom HTML nodes",
      message: "Duplicate element ids across custom HTML nodes",
      type: "best-practice",
      recommendation:
        "The element id '%' is used in multiple nodes (%). Use unique element ids across nodes.",
    });
  }

  /**
   * Extract the id="..." attribute values from an HTML string.
   * The (?<![\w-]) lookbehind rejects other attributes ending in "id"
   * (formId=, data-id=, aria-id=). Returns lowercase-unique ids.
   */
  extractElementIds(html) {
    if (typeof html !== "string") return [];

    const ids = [];
    const regex = /(?<![\w-])id\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const id = match[2] ?? match[3] ?? match[4];
      if (id) ids.push(id.toLowerCase());
    }
    return [...new Set(ids)];
  }

  /**
   * Flatten a rich-text property value (a JSON string like
   * '[{"children":[{"text":"<form id=\"x\">"}]}]') to plain HTML.
   * Non-rich-text input is returned as-is.
   */
  flattenRichText(value) {
    if (typeof value !== "string" || !value.trimStart().startsWith("[")) {
      return value;
    }

    try {
      const parsed = JSON.parse(value);
      return parsed
        ?.map((part) =>
          part?.children?.map((child) => child?.text || "").join(""),
        )
        ?.join("");
    } catch (err) {
      // not JSON - treat the raw string as HTML
      return value;
    }
  }

  runRule() {
    try {
      for (const flow of this.allFlows) {
        const nodes = flow?.graphData?.elements?.nodes;

        // id -> [{ nodeId, nodeTitle }]
        const idOwners = new Map();

        nodes?.forEach((node) => {
          const { data } = node;

          // Only Custom HTML nodes (httpConnector customHTMLTemplate)
          // participate - the HTML of such a node lives in its customHTML
          // property. customScript is deliberately not scanned (scripts
          // reference other elements' ids) and other node types carry no
          // rendered HTML.
          if (
            data.nodeType !== "CONNECTION" ||
            data.connectorId !== "httpConnector" ||
            data.capabilityName !== "customHTMLTemplate"
          ) {
            return;
          }

          const html = this.flattenRichText(
            data.properties?.customHTML?.value,
          );
          if (typeof html !== "string") return;

          this.extractElementIds(html).forEach((id) => {
            const owners = idOwners.get(id) || [];
            if (!owners.some((o) => o.nodeId === data.id)) {
              owners.push({
                nodeId: data.id,
                nodeTitle:
                  data.properties?.nodeTitle?.value || data.name || data.id,
              });
            }
            idOwners.set(id, owners);
          });
        });

        // Flag ids used in more than one node
        idOwners.forEach((owners, id) => {
          if (owners.length > 1) {
            this.addError("dv-bp-customHtml-001", {
              flowId: flow.flowId,
              recommendationArgs: [
                id,
                owners.map((o) => `${o.nodeTitle} (${o.nodeId})`).join(", "),
              ],
              nodeId: owners[owners.length - 1].nodeId,
            });
          }
        });
      }
    } catch (err) {
      this.addError(undefined, { messageArgs: [`${err}`] });
    }
  }
}

module.exports = CustomHtmlRule;
