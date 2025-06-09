<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:xlf="urn:oasis:names:tc:xliff:document:2.0" xmlns:xl2="urn:oasis:names:tc:xliff:document:1.2"  version="1.0">
	<!-- Step 3. This document takes the strings from deepl.com and inserts them into missing units in the .xlf -->
	<!-- This url is replaced with the URL of the XML file created in Step 2. -->
	<!-- After it runs, reformat with CTRL-SHIFT-P but then you have to combine lines that shouldn't have been split -->
	<!-- Find: \n\s+([^\<\s]) and Replace: a space and $1. -->
	<xsl:variable name="cng"
		select="document('file:/C:/Users/gtrih/git/transcriber/localization/string-with-id.xml')"/>
	<xsl:variable name="eng"
		select="document('file:/C:/Users/gtrih/git/transcriber/localization/TranscriberAdmin-en.xlf')"/>
	<xsl:variable name="crowd"
		select="document('file:/C:/Users/gtrih/git/transcriber/localization/TranscriberAdmin-xx-1.2.xliff')"/>
	
	<xsl:template match="/">
		<xsl:apply-templates select="node() |@*"/>
	</xsl:template>
	
	<xsl:template match="xlf:file">
		<xsl:variable name="in" select="."/>
		<xsl:copy>
			<xsl:apply-templates select="@*"/>
			<xsl:apply-templates select="$eng//xlf:unit">
				<xsl:with-param name="in" select="$in"/>
			</xsl:apply-templates>
		</xsl:copy>
	</xsl:template>
	
	<xsl:template match="xlf:target">
		<xsl:param name="in"/>
		<xsl:variable name="id" select="parent::*/parent::*/@id"/>
		<xsl:variable name="cngNode" select="$cng//*[@id=$id]"/>
		<xsl:variable name="crowdNode" select="$crowd//*[@id=$id]/xl2:target"/>
		<xsl:variable name="inNode" select="$in//*[@id=$id]//xlf:target"/>
		<xsl:copy>
			<xsl:choose>
				<xsl:when test="$crowdNode[@state='translated']">
					<xsl:value-of select="$crowdNode/text()"/>
				</xsl:when>
				<xsl:when test="$cngNode">
					<xsl:value-of select="$cngNode/t/text()"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="$inNode/text()"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:copy>
	</xsl:template>
	
	<xsl:template match="node()|@*">
		<xsl:param name="in"/>
		<xsl:copy>
			<xsl:apply-templates select="node()|@*">
				<xsl:with-param name="in" select="$in"/>
			</xsl:apply-templates>
		</xsl:copy>
	</xsl:template>
	
	
</xsl:stylesheet>
