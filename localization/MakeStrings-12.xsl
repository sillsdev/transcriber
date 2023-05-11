<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:xliff="urn:oasis:names:tc:xliff:document:1.2"
	version="2.0" exclude-result-prefixes="xliff">
	<!-- This is used as part of localization/program.cs logic -->
	
	<xsl:param name="v2File"/>
	<xsl:variable name="v2" select="document($v2File)"/>
	
	<xsl:output indent="yes"/>
	
	<xsl:template match="/">
		<strings>
			<xsl:for-each select="//xliff:trans-unit[not(substring-before(@id,'.') = preceding::xliff:trans-unit/substring-before(@id,'.'))]">
				<xsl:variable name="section" select="substring-before(@id,'.')"/>
				<xsl:element name="{$section}">
					<xsl:element name="{substring-before(concat(//@target-language, '-'), '-')}">
						<xsl:apply-templates select="//xliff:trans-unit[substring-before(@id,'.') = $section]"/>
					</xsl:element>
				</xsl:element>
			</xsl:for-each>
		</strings>
	</xsl:template>
	
	<xsl:template match="xliff:trans-unit">
		<xsl:element name="{substring-after(@id, '.')}">
			<xsl:variable name="uId" select="@id"/>
			<xsl:choose>
				<xsl:when test="normalize-space(.//xliff:target[@state != 'needs-translation']) != ''">
					<xsl:value-of select="xliff:target"/>
				</xsl:when>
				<xsl:when test="normalize-space($v2//*[@id=$uId]//*[local-name() = 'target']) != ''">
					<xsl:value-of select="$v2//*[@id=$uId]//*[local-name() = 'target']"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="xliff:source"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:element>
	</xsl:template>
</xsl:stylesheet>