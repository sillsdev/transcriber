<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns="urn:oasis:names:tc:xliff:document:2.0"
	xmlns:ns12="urn:oasis:names:tc:xliff:document:1.2"
	version="1.0">
	
	<xsl:output indent="yes"/>
	<xsl:param name="fileId">TranscriberAdmin</xsl:param>
	
	<xsl:template match="ns12:xliff">
		<xsl:element name="xliff" namespace="urn:oasis:names:tc:xliff:document:2.0">
			<xsl:attribute name="srcLang">en</xsl:attribute>
			<xsl:attribute name="trgLang">
				<xsl:value-of select="//ns12:file[1]/@target-language"/>
			</xsl:attribute>
			<xsl:attribute name="version">1.0</xsl:attribute>
			<xsl:apply-templates/>
		</xsl:element>
	</xsl:template>
	
	<xsl:template match="ns12:file">
		<xsl:element name="file" namespace="urn:oasis:names:tc:xliff:document:2.0">
			<xsl:attribute name="id">
				<xsl:value-of select="$fileId"/>
			</xsl:attribute>
			<xsl:attribute name="original">
				<xsl:value-of select="@original"/>
			</xsl:attribute>
			<xsl:apply-templates select=".//ns12:trans-unit"/>	
		</xsl:element>
	</xsl:template>
	
	<xsl:template match="ns12:trans-unit">
		<xsl:element name="unit" namespace="urn:oasis:names:tc:xliff:document:2.0">
			<xsl:attribute name="id">
				<xsl:value-of select="@id"/>
			</xsl:attribute>
			<xsl:element name="segment" namespace="urn:oasis:names:tc:xliff:document:2.0">
				<xsl:element name="source" namespace="urn:oasis:names:tc:xliff:document:2.0">
					<xsl:value-of select=".//ns12:source"/>
				</xsl:element>
				<xsl:element name="target" namespace="urn:oasis:names:tc:xliff:document:2.0">
					<xsl:value-of select=".//ns12:target"/>
				</xsl:element>
			</xsl:element>
		</xsl:element>
	</xsl:template>
</xsl:stylesheet>