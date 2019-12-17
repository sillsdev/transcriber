export const updateXml = (xpath: string, xmlDoc: Document, val: string) => {
  if (xmlDoc.evaluate) {
    const nodes = xmlDoc.evaluate(
      '//' + xpath,
      xmlDoc,
      null,
      XPathResult.ANY_TYPE,
      null
    );
    const result = nodes.iterateNext();
    if (result) {
      switch (result.nodeType) {
        case 1:
          (result as Element).innerHTML = val;
          break;
        case 2:
          result.nodeValue = val;
          break;
      }
    }
  } // TODO: Internet Explorer will need its own logic
  // See: https://www.w3schools.com/xml/tryit.asp?filename=try_xpath_select_cdnodes
};

export default updateXml;
