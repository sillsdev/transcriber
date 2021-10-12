<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:xlf="urn:oasis:names:tc:xliff:document:2.0">
  <xsl:output method="xml" encoding="UTF-8" indent="yes"/>
	
	<xsl:template match="xlf:file">
		<xsl:copy>
			<xsl:apply-templates select="@*"/>
			<xsl:apply-templates select="xlf:unit">
				<xsl:sort select="@id"/>
			</xsl:apply-templates>
		</xsl:copy>
	</xsl:template>
	
	<xsl:template match="xlf:source|xlf:target">
		<xsl:copy-of select="."/>
	</xsl:template>

	<xsl:template match="node() |@*">
		<xsl:copy>
			<xsl:apply-templates select="node() |@*"/>
		</xsl:copy>
	</xsl:template>
	
	<xsl:template match="text()"/>
	
</xsl:stylesheet>