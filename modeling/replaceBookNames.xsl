<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	version="1.0">
	
	<xsl:variable name="bahasa" select="document('file:/C:/Users/Trihus/Documents/My%20Data%20Sources/bahasa.xml')"/>
	
	<xsl:template match="r">
		<xsl:copy>
			<xsl:variable name="code" select="code"/>
			<xsl:copy-of select="code"/>
			<xsl:element name="abbr">
				<xsl:value-of select="code"/>
			</xsl:element>
			<xsl:variable name="n" select="$bahasa//r[code = $code]/bi"/>
			<xsl:element name="short">
				<xsl:choose>
					<xsl:when test="$n">
						<xsl:value-of select="$n"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="short"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:element>
			<xsl:element name="long">
				<xsl:choose>
					<xsl:when test="$n">
						<xsl:value-of select="$n"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="long"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:element>
		</xsl:copy>
	</xsl:template>
	
	<xsl:template match="node() |@*">
		<xsl:copy>
			<xsl:apply-templates select="node() |@*"/>
		</xsl:copy>
	</xsl:template>
	
</xsl:stylesheet>