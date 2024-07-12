const { LintRule } = require("@pingidentity/dvlint");

class AnnotationRules extends LintRule {
  constructor() {
    super({
      id: "dv-rule-annotations-001",
      description:
        "Verify several best prctices for annotations nodes include checks on color, font and positions on the canvas",
      cleans: false,
      reference: "https://library.pingidentity.com/page/davinci-color-palette",
    });
    this.addCode("dv-bp-annotation-001", {
      description:
        "Found color not included in best practices list for annotation node",
      message: "Annotation color is not in palette [%] (%)",
      type: "best-practice",
      recommendation: "Use recommended CSS settings for Ping developed flows",
    });
    this.addCode("dv-bp-annotation-002", {
      description: "Found non-standard fontFamily used for Annotation",
      message: "Annotation font is not in sans-serif [%] (%)",
      type: "best-practice",
      recommendation: "Use sans-serif fontFamily for Annotations",
    });
    this.addCode("dv-bp-missing-title-annotation-001", {
      description: "Title annotation node not found",
      message:
        "Each flow should contain a title annotation node with a background color of #4462ed",
      type: "best-practice",
      recommendation: "Add a title annotation node",
    });
    this.addCode("dv-bp-title-not-on-top-001", {
      description: "Title annotation not on top of flow",
      message: "The topmost node in your flow should be a title annotation (%)",
      type: "best-practice",
      recommendation: "Position title annotation at top of the flow",
    });
    this.addCode("dv-bp-annotation-003", {
      description:
        "It is a best practice to include annotations to document your flow",
      message: "Flow contains no annotations",
      type: "best-practice",
      recommendation: "Add annotations to flow",
    });
  }

  runRule() {
    try {
      const annotationNodes = this.dvUtil.getNodesByType("annotationConnector");

      this.testAnnotationColors(annotationNodes);
      this.testAnnotationFonts(annotationNodes);
      this.testAnnotationTitle(annotationNodes);
      this.testTitleAtTop();
      this.testMissingAnnotations(annotationNodes);
    } catch (err) {
      this.addError(undefined, { messageArgs: [`${err}`] });
    }
  }

  /**
   * Test annotation color based on set of expected colors
   * @param {*} nodes
   */
  testAnnotationColors(nodes) {
    const colors = [
      "#4462edff",
      "#5d00d6ff",
      "#f2f3f4ff",
      "#fffaa0ff",
      "#fffaa0ff",
      "#50e3c2ff",
      "#ffffffff",
      "#f7f7adff",
    ];

    nodes.forEach((node) => {
      const { data } = node;
      const backgroundColor =
        data.properties?.backgroundColor?.value?.toLowerCase();

      if (!colors.includes(backgroundColor)) {
        this.addError("dv-bp-annotation-001", {
          messageArgs: [data.properties.backgroundColor.value, data.id],
          nodeId: data.id,
        });
      }
    });
  }

  /**
   * Test annotation fonts based on expected font family.
   *
   * Additionally, this will clean the flow replacing any invalid
   * font families with the expected font family.
   * @param {*} nodes
   */
  testAnnotationFonts(nodes) {
    const fontFamily = "sans-serif";

    nodes.forEach((node) => {
      const { data } = node;
      if (
        data.properties?.fontFamily?.value?.toLowerCase() !==
        fontFamily.toLowerCase()
      ) {
        this.addError("dv-bp-annotation-002", {
          messageArgs: [data.properties.fontFamily.value, data.id],
          nodeId: data.id,
        });

        if (this.cleanFlow) {
          data.properties.fontFamily.value = fontFamily;
          this.addCleanResult(
            "Set annotation font to sans-serif",
            data.id,
            "fontFamily"
          );
        }
      }
    });
  }

  /**
   * Verify that a title annotation is present in the flow by looking for
   * a flow with background color.
   * @param {*} nodes
   */
  testAnnotationTitle(nodes) {
    const titleAnnotationColor = "#4462edff";
    let titleNodePresent;

    nodes.forEach((node) => {
      const { data } = node;
      if (data.properties?.backgroundColor?.value === titleAnnotationColor) {
        titleNodePresent = true;
      }
    });

    if (!titleNodePresent) {
      this.addError("dv-bp-missing-title-annotation-001", {});
    }
  }

  testTitleAtTop() {
    const annotationType = "annotationConnector";
    const annotationColor = "#4462edff";

    const flowNodeTypes = this.dvUtil.getFlowNodeTypes();
    let nodeTopYCoord = Number.MAX_SAFE_INTEGER;

    // Ensure annotationConnector is in list of nodes
    if (flowNodeTypes && flowNodeTypes.includes(annotationType)) {
      flowNodeTypes.forEach((nodeType) => {
        if (nodeType === annotationType) {
          return; // Skip annotation nodes
        }
        const nodesByType = this.dvUtil.getNodesByType(nodeType);
        if (nodesByType) {
          nodesByType.forEach((node) => {
            const { position } = node;
            // Capture the node with the smallest y coord
            if (position.y < nodeTopYCoord) {
              nodeTopYCoord = position.y;
            }
          });
        }
      });

      const annotationNodes = this.dvUtil.getNodesByType(annotationType);
      const titleAnnotation = annotationNodes.filter(
        (obj) =>
          obj.data?.properties?.backgroundColor?.value === annotationColor
      );

      if (titleAnnotation.length > 0) {
        const { position, data } = titleAnnotation[0];
        if (position?.y > nodeTopYCoord) {
          this.addError("dv-bp-title-not-on-top-001", {
            messageArgs: [data.id],
            nodeId: data.id,
          });
        }
      }
    }
  }

  testMissingAnnotations(nodes) {
    const annotationType = "annotationConnector";
    const flowNodeTypes = this.dvUtil.getFlowNodeTypes();

    if (!flowNodeTypes.includes(annotationType)) {
      this.addError("dv-bp-annotation-003", {});
    }
  }
}

module.exports = AnnotationRules;
