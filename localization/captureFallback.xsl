<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns="urn:oasis:names:tc:xliff:document:2.0"
	xmlns:ns12="urn:oasis:names:tc:xliff:document:1.2"
	xmlns:ns20="urn:oasis:names:tc:xliff:document:2.0"
	version="1.0">
	
	<xsl:param name="prev" select="document('file:ta/TranscriberAdmin-en-1.2.xliff')"/>
	
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