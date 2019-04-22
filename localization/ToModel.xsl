<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:xliff="urn:oasis:names:tc:xliff:document:1.2"
	version="2.0" exclude-result-prefixes="xliff">
	
	<xsl:output method="text"/>
	
	<xsl:template match="/">
		<xsl:text>// WARNING: This file is generated using ToModel.xsl. Changes made here may be lost.&#10;</xsl:text>
		<xsl:text>import * as Localize from 'react-localization';&#10;&#10;</xsl:text>
		<xsl:for-each select="//xliff:trans-unit[not(substring-before(@id,'.') = preceding::xliff:trans-unit/substring-before(@id,'.'))]">
			<xsl:variable name="section" select="substring-before(@id,'.')"/>
			<xsl:text>export interface I</xsl:text>
			<xsl:value-of select="upper-case(substring($section,1,1))"/>
			<xsl:value-of select="substring($section,2)"/>
			<xsl:text>Strings extends Localize.LocalizedStringsMethods {&#10;</xsl:text>
			<xsl:for-each select="//xliff:trans-unit[substring-before(@id,'.') = $section]">
				<xsl:text>    "</xsl:text>
				<xsl:value-of select="substring-after(@id,'.')"/>
				<xsl:text>": string;&#10;</xsl:text>
			</xsl:for-each>
			<xsl:text>};&#10;&#10;</xsl:text>
		</xsl:for-each>
		<xsl:text>export interface ILocalizedStrings {&#10;</xsl:text>
		<xsl:text>&#9;loaded: boolean;&#10;</xsl:text>
		<xsl:text>&#9;lang: string;&#10;</xsl:text>
		<xsl:for-each select="//xliff:trans-unit[not(substring-before(@id,'.') = preceding::xliff:trans-unit/substring-before(@id,'.'))]">
			<xsl:variable name="section" select="substring-before(@id,'.')"/>
			<xsl:text>&#9;</xsl:text>
			<xsl:value-of select="$section"/>
			<xsl:text>: I</xsl:text>
			<xsl:value-of select="upper-case(substring($section,1,1))"/>
			<xsl:value-of select="substring($section,2)"/>
			<xsl:text>Strings;&#10;</xsl:text>
		</xsl:for-each>
		<xsl:text>&#9;[key: string]: any;&#10;</xsl:text>
		<xsl:text>};&#10;</xsl:text>
	</xsl:template>
</xsl:stylesheet>