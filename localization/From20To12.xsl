<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:ns20="urn:oasis:names:tc:xliff:document:2.0"
	xmlns="urn:oasis:names:tc:xliff:document:1.2"
	version="1.0">
	
	<xsl:output indent="yes"/>
	
	<xsl:template match="ns20:xliff">
		<xsl:element name="xliff" namespace="urn:oasis:names:tc:xliff:document:1.2">
			<xsl:attribute name="version">1.2</xsl:attribute>
			<xsl:apply-templates/>
		</xsl:element>
	</xsl:template>
	
	<xsl:template match="ns20:file">
		<xsl:element name="file" namespace="urn:oasis:names:tc:xliff:document:1.2">
			<xsl:attribute name="original">
				<xsl:value-of select="@original"/>
			</xsl:attribute>
			<xsl:attribute name="source-language">
				<xsl:value-of select="parent::*/@srcLang"/>
			</xsl:attribute>
			<xsl:attribute name="target-language">
				<xsl:value-of select="parent::*/@trgLang"/>
			</xsl:attribute>
			<xsl:attribute name="datatype">plaintext</xsl:attribute>
			<xsl:element name="body" namespace="urn:oasis:names:tc:xliff:document:1.2">
				<xsl:apply-templates/>	
			</xsl:element>
		</xsl:element>
	</xsl:template>
	
	<xsl:template match="ns20:unit">
		<xsl:element name="trans-unit" namespace="urn:oasis:names:tc:xliff:document:1.2">
			<xsl:attribute name="id">
				<xsl:value-of select="@id"/>
			</xsl:attribute>
			<xsl:element name="source" namespace="urn:oasis:names:tc:xliff:document:1.2">
				<xsl:value-of select=".//ns20:source"/>
			</xsl:element>
			<xsl:element name="target" namespace="urn:oasis:names:tc:xliff:document:1.2">
				<xsl:value-of select=".//ns20:target"/>
			</xsl:element>
		</xsl:element>
	</xsl:template>
</xsl:stylesheet>