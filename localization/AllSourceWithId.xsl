<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:xlf="urn:oasis:names:tc:xliff:document:2.0"
	xmlns:xl2="urn:oasis:names:tc:xliff:document:1.2" version="1.0">
	<!-- Step 1. This will capture the strings with their id's for spelling checking with spreadsheet -->
	<xsl:output omit-xml-declaration="yes"/>

	<xsl:template match="node() |@*">
		<xsl:variable name="id" select="parent::*/@id"/>
		<xsl:choose>
			<xsl:when
				test="local-name() = 'segment'">
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
