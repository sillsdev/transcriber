<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:xlf="urn:oasis:names:tc:xliff:document:2.0"
	xmlns:xl2="urn:oasis:names:tc:xliff:document:1.2" version="1.0">
	<!-- Step 1. This can be run in the Oxygen debugger with the corresponding .xlf file and the results pasted into deepl.com -->
	<!-- It finds strings with no translation in either the crowdin xliff or the .xlf -->
	<xsl:output omit-xml-declaration="yes"/>
	<!-- This document is exported from a folder in SILTranscriberTranslations.zip and renamed according to the language -->
	<xsl:variable name="crowd"
		select="document('file:/C:/Users/Trihus/git/transcriber/localization/TranscriberAdmin-ru-1.2.xliff')"/>

	<xsl:template match="node() |@*">
		<xsl:variable name="id" select="parent::*/@id"/>
		<xsl:choose>
			<xsl:when
				test="local-name() = 'segment' and not(xlf:target/text()) and $crowd//*[@id=$id]/xl2:target/@state != 'translated'">
				<xsl:value-of select="xlf:source"/>
				<xsl:text>&#xa;</xsl:text>
			</xsl:when>
			<xsl:otherwise>
				<xsl:apply-templates select="node() |@*"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

</xsl:stylesheet>
