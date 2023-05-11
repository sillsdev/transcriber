<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:ns2="urn:oasis:names:tc:xliff:document:2.0"
	version="1.0">
	<!-- Process language .xlf against English. Add missing, remove deleted, and remove translations of changed. -->
	
	<xsl:output indent="yes"/>
	<xsl:param name="en" select="document('file:TranscriberAdmin-en.xlf')"/>
	
	<xsl:template match="ns2:unit">
		<xsl:variable name="id" select="@id"/>
		<xsl:variable name="n" select="$en//ns2:unit[@id = $id]"/>
		<xsl:if test="$n">
			<xsl:copy>
				<xsl:apply-templates select="$n/@*"/>
				<xsl:element name="segment" namespace="urn:oasis:names:tc:xliff:document:2.0">
					<xsl:copy-of select="$n//ns2:source"/>
					<xsl:choose>
						<xsl:when test=".//ns2:source = $n//ns2:source">
							<xsl:copy-of select=".//ns2:target"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:element name="target" namespace="urn:oasis:names:tc:xliff:document:2.0"/>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:element>
			</xsl:copy>
			<xsl:choose>
				<xsl:when test="$n/following-sibling::*[1]/@id = parent::*//@id"/>
				<xsl:otherwise>
					<xsl:apply-templates select="$n/following-sibling::*[1]"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:if>
	</xsl:template>
	
	<xsl:template match="node()|@*">
		<xsl:copy>
			<xsl:apply-templates select="node()|@*"/>
		</xsl:copy>
	</xsl:template>
	
	<xsl:template match="text()[normalize-space(.) = '']"/>
	
</xsl:stylesheet>