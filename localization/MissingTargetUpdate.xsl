<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:xlf="urn:oasis:names:tc:xliff:document:2.0" version="1.0">
	<!-- Step 3. This document takes the strings from deepl.com and inserts them into missing units in the .xlf -->
	<!-- This url is replaced with the URL of the XML file created in Step 2. -->
	<!-- After it runs, reformat with CTRL-SHIFT-P but then you have to combine lines that shouldn't have been split -->
	<!-- Find: \n\s+([^\<\s]) and Replace: a space and $1. -->
	<xsl:variable name="cng"
		select="document('file:/C:/Users/Trihus/git/transcriber/localization/ru-trg.xml')"/>

	<xsl:template match="node() |@*">
		<xsl:choose>
			<xsl:when
				test="local-name() = 'segment' and not(xlf:target/text()) and parent::*/@id = $cng//@id">
				<xsl:variable name="id" select="parent::*/@id"/>
				<xsl:variable name="n" select="$cng//*[@id = $id]"/>
				<xsl:copy>
					<xsl:text>&#xa;</xsl:text>
					<xsl:copy-of select="xlf:source"/>
					<xsl:text>&#xa;</xsl:text>
					<xsl:element name="target" namespace="urn:oasis:names:tc:xliff:document:2.0">
						<xsl:value-of select="$n/t"/>
					</xsl:element>
					<xsl:text>&#xa;</xsl:text>
				</xsl:copy>
			</xsl:when>
			<xsl:otherwise>
				<xsl:copy>
					<xsl:apply-templates select="node() |@*"/>
				</xsl:copy>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

</xsl:stylesheet>
