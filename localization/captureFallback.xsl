<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns="urn:oasis:names:tc:xliff:document:2.0"
	xmlns:ns12="urn:oasis:names:tc:xliff:document:1.2"
	xmlns:ns20="urn:oasis:names:tc:xliff:document:2.0"
	version="1.0">
	<!-- This copies the localization strings used by SIL Transcriber 1.0 for use in 2.0 -->
	
	<xsl:param name="lg">ta</xsl:param>
	<xsl:param name="prev" select="document(concat('file:',$lg,'/TranscriberAdmin-en-1.2.xliff'))"/>
	<xsl:param name="v1Name" select="concat('file:../../Transcribe/src/portable/ReactUi/data/localization/TranscriberUi-',$lg,'.xlf')"/>
	<xsl:param name="v1" select="document($v1Name)"/>
	
	<xsl:output method="xml" encoding="UTF-8" indent="yes" />
	
	<xsl:template match="ns20:segment">
		<xsl:copy>
			<xsl:copy-of select="ns20:source"/>
			<xsl:variable name="src" select="ns20:source/text()"/>
			<xsl:choose>
				<xsl:when test="$src = $prev//ns12:source">
					<xsl:element name="target" namespace="urn:oasis:names:tc:xliff:document:2.0">
						<xsl:value-of select="$prev//*[ns12:source/text() = $src]/ns12:target/text()"/>
					</xsl:element>
				</xsl:when>
				<xsl:when test="$src = $v1//ns20:source">
					<xsl:element name="target" namespace="urn:oasis:names:tc:xliff:document:2.0">
						<xsl:value-of select="$v1//*[ns20:source/text() = $src]/ns20:target/text()"/>
					</xsl:element>
				</xsl:when>
				<xsl:otherwise>
					<xsl:copy-of select="ns20:target"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:copy>
	</xsl:template>
	
	<xsl:template match="node()|@*">
		<xsl:copy>
			<xsl:apply-templates select="node()|@*"/>
		</xsl:copy>
	</xsl:template>
	
	<xsl:template match="text()[normalize-space(.) = '']"/>
	
</xsl:stylesheet>