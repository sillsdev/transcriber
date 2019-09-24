<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:xliff="urn:oasis:names:tc:xliff:document:1.2"
	version="2.0" exclude-result-prefixes="xliff">
	
	<xsl:output method="text"/>
	
	<xsl:template match="/">
		<xsl:text>// WARNING: This file is generated using ToReducer.xsl. Changes made here may be lost.&#10;</xsl:text>
		<xsl:text>import LocalizedStrings from 'react-localization';&#10;</xsl:text>
		<xsl:text>import { FETCH_LOCALIZATION, SET_LANGUAGE } from './types';&#10;</xsl:text>
		<xsl:text>import { ILocalizedStrings } from './model';&#10;&#10;</xsl:text>
		<xsl:text>const initialState = {&#10;</xsl:text>
		<xsl:text>&#9;"loaded": false,&#10;</xsl:text>
		<xsl:text>&#9;"lang": 'en',&#10;</xsl:text>
		<xsl:for-each select="//xliff:trans-unit[not(substring-before(@id,'.') = preceding::xliff:trans-unit/substring-before(@id,'.'))]">
			<xsl:variable name="section" select="substring-before(@id,'.')"/>
			<xsl:text>&#9;"</xsl:text>
			<xsl:value-of select="$section"/>
			<xsl:text>": new LocalizedStrings({&#10;</xsl:text>
			<xsl:text>&#9;&#9;"en": {&#10;</xsl:text>
			<xsl:for-each select="//xliff:trans-unit[substring-before(@id,'.') = $section]">
				<xsl:text>&#9;&#9;&#9;"</xsl:text>
				<xsl:value-of select="substring-after(@id,'.')"/>
				<xsl:text>": "</xsl:text>
				<xsl:value-of select=".//xliff:source"/>
				<xsl:text>",&#10;</xsl:text>
			</xsl:for-each>
			<xsl:text>&#9;&#9;}&#10;</xsl:text>
			<xsl:text>&#9;}),&#10;</xsl:text>
		</xsl:for-each>
		<xsl:text>};&#10;&#10;</xsl:text>
		<xsl:text>export default function (state = initialState, action: any): ILocalizedStrings {&#10;</xsl:text>
		<xsl:text>&#9;switch (action.type) {&#10;</xsl:text>
		<xsl:text>&#9;&#9;case FETCH_LOCALIZATION:&#10;</xsl:text>
		<xsl:text>&#9;&#9;&#9;return {&#10;</xsl:text>
		<xsl:text>&#9;&#9;&#9;&#9;...state,&#10;</xsl:text>
		<xsl:text>&#9;&#9;&#9;&#9;"loaded": true,&#10;</xsl:text>
		<xsl:for-each select="//xliff:trans-unit[not(substring-before(@id,'.') = preceding::xliff:trans-unit/substring-before(@id,'.'))]">
			<xsl:variable name="section" select="substring-before(@id,'.')"/>
			<xsl:text>&#9;&#9;&#9;&#9;"</xsl:text>
			<xsl:value-of select="$section"/>
			<xsl:text>" : new LocalizedStrings(action.payload.data.</xsl:text>
			<xsl:value-of select="$section"/>
			<xsl:text>),&#10;</xsl:text>
		</xsl:for-each>
		<xsl:text>&#9;&#9;&#9;};&#10;</xsl:text>
		<xsl:text>&#9;&#9;case SET_LANGUAGE:&#10;</xsl:text>
		<xsl:text>&#9;&#9;&#9;return {&#10;</xsl:text>
		<xsl:text>&#9;&#9;&#9;&#9;...state,&#10;</xsl:text>
		<xsl:text>&#9;&#9;&#9;&#9;lang: action.payload,&#10;</xsl:text>
		<xsl:text>&#9;&#9;&#9;};&#10;</xsl:text>
		<xsl:text>&#9;&#9;default:&#10;</xsl:text>
		<xsl:text>&#9;&#9;&#9;return state;&#10;</xsl:text>
		<xsl:text>&#9;}&#10;</xsl:text>
		<xsl:text>}&#10;</xsl:text>
	</xsl:template>
</xsl:stylesheet>