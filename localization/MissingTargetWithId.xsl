<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:xlf="urn:oasis:names:tc:xliff:document:2.0"
	xmlns:xl2="urn:oasis:names:tc:xliff:document:1.2" version="1.0">
	<!-- Step 2. This will capture the same strings as MissingTarget.xsl but also gets the id. -->
	<!-- The results can be pasted into Excel and will give two columns: the id, and the English -->
	<!-- The third column in the Excel sheet will be the results given by deep1.com -->
	<!-- Using find-replace in Notepad++ this can be converted to an XML file for use by the next step -->
	<!-- Find: (.+)\t(.+)\t(.+) and replace with: <r id="$1"><s>$2</s><t>$3</t></r> add <root> to top and </root> to bottom -->
	<xsl:output omit-xml-declaration="yes"/>
	<xsl:variable name="crowd"
		select="document('file:/C:/Users/Trihus/git/transcriber/localization/TranscriberAdmin-ru-1.2.xliff')"/>

	<xsl:template match="node() |@*">
		<xsl:variable name="id" select="parent::*/@id"/>
		<xsl:choose>
			<xsl:when
				test="local-name() = 'segment' and not(xlf:target/text()) and $crowd//*[@id=$id]/xl2:target/@state != 'translated'">
				<xsl:value-of select="parent::*/@id"/>
				<xsl:text>&#x9;</xsl:text>
				<xsl:value-of select="xlf:source"/>
				<xsl:text>&#xa;</xsl:text>
			</xsl:when>
			<xsl:otherwise>
				<xsl:apply-templates select="node() |@*"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

</xsl:stylesheet>
