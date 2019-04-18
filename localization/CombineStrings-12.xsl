<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:xliff="urn:oasis:names:tc:xliff:document:1.2"
	version="2.0" exclude-result-prefixes="xliff">
	
	<xsl:output omit-xml-declaration="yes"/>

	<xsl:variable name="en" select="document('TranscriberAdmin-en-1.2.xml')"/>
	<xsl:variable name="fr" select="document('TranscriberAdmin-en-1.2-fr.xml')"/>
	
	<xsl:output indent="yes"/>
	
	<xsl:template match="/">
		<strings>
			<xsl:for-each select="//xliff:trans-unit[not(substring-before(@id,'.') = preceding::xliff:trans-unit/substring-before(@id,'.'))]">
				<xsl:variable name="section" select="substring-before(@id,'.')"/>
				<xsl:element name="{$section}">
					<xsl:copy-of select="$en//*[local-name() = $section]/en"/>
					<xsl:copy-of select="$fr//*[local-name() = $section]/fr"/>
				</xsl:element>
			</xsl:for-each>
		</strings>
	</xsl:template>
</xsl:stylesheet>