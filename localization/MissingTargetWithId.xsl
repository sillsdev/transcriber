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
		select="document('file:/C:/Users/gtrih/git/transcriber/localization/TranscriberAdmin-xx-1.2.xliff')"/>

	<xsl:template match="/">
		<xsl:apply-templates select="//xlf:segment"/>
		<xsl:apply-templates select="$crowd//xl2:trans-unit">
			<xsl:with-param name="in" select="/"/>
		</xsl:apply-templates>
	</xsl:template>

	<xsl:template match="xlf:segment">
		<xsl:variable name="id" select="parent::*/@id"/>
		<xsl:variable name="crowdNode" select="$crowd//*[@id=$id]"/>
		<xsl:choose>
			<xsl:when test="count($crowdNode) = 0"/>
			<xsl:when
				test="normalize-space(xlf:source/text()) != normalize-space($crowdNode/xl2:source/text()) or ((count(xlf:target/text()) = 0 or normalize-space(xlf:target/text()) = '') and $crowdNode/xl2:target/@state != 'translated')">
				<xsl:value-of select="parent::*/@id"/>
				<xsl:text>&#x9;</xsl:text>
				<xsl:value-of select="$crowdNode/xl2:source"/>
				<xsl:text>&#xa;</xsl:text>
			</xsl:when>
		</xsl:choose>
	</xsl:template>

	<xsl:template match="xl2:trans-unit">
		<xsl:param name="in"/>
		<xsl:variable name="id" select="@id"/>
		<xsl:variable name="inNode" select="$in//*[@id=$id]"/>
		<xsl:choose>
			<xsl:when test="count($inNode) = 0">
				<xsl:value-of select="$id"/>
				<xsl:text>&#x9;</xsl:text>
				<xsl:value-of select="./xl2:source/text()"/>
				<xsl:text>&#xa;</xsl:text>
			</xsl:when>
		</xsl:choose>
	</xsl:template>



</xsl:stylesheet>
