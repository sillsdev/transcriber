<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:ns2="urn:oasis:names:tc:xliff:document:2.0" version="1.0">
	<!-- Process language .xlf against English. Add missing, remove deleted, and remove translations of changed. -->

	<xsl:output indent="yes"/>
	<xsl:param name="en" select="document('file:TranscriberAdmin-en.xlf')"/>
	<xsl:variable name="xx" select="/"/>

	<xsl:template match="ns2:file">
		<xsl:copy>
			<xsl:copy-of select="@*"/>
			<xsl:for-each select="$en//ns2:unit">
				<xsl:copy>
					<xsl:copy-of select="@*"/>
					<xsl:variable name="id" select="@id"/>
					<xsl:variable name="s" select="$en//ns2:unit[@id = $id]"/>
					<xsl:variable name="d" select="$xx//ns2:unit[@id = $id]"/>
					<xsl:element name="segment" namespace="urn:oasis:names:tc:xliff:document:2.0">
						<xsl:element name="source" namespace="urn:oasis:names:tc:xliff:document:2.0">
							<xsl:value-of select="$s//ns2:source"/>
						</xsl:element>
						<xsl:choose>
							<xsl:when test="normalize-space($d//ns2:source/text()) = normalize-space($s//ns2:source/text())">
								<xsl:copy-of select="$d//ns2:target"/>
							</xsl:when>
							<xsl:otherwise>
								<xsl:element name="target"
									namespace="urn:oasis:names:tc:xliff:document:2.0"/>
							</xsl:otherwise>
						</xsl:choose>
					</xsl:element>
				</xsl:copy>
			</xsl:for-each>
		</xsl:copy>
	</xsl:template>

	<xsl:template match="node()|@*">
		<xsl:copy>
			<xsl:apply-templates select="node()|@*"/>
		</xsl:copy>
	</xsl:template>

	<xsl:template match="text()[normalize-space(.) = '']"/>

</xsl:stylesheet>
