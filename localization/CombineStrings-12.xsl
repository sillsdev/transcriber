<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:xliff="urn:oasis:names:tc:xliff:document:1.2"
	version="2.0" exclude-result-prefixes="xliff">
	
	<xsl:output omit-xml-declaration="yes"/>

	<xsl:variable name="en" select="document('TranscriberAdmin-en-1.2.xml')"/>
	<xsl:variable name="fr" select="document('TranscriberAdmin-en-1.2-fr.xml')"/>
	<xsl:variable name="pt" select="document('TranscriberAdmin-en-1.2-pt.xml')"/>
	<xsl:variable name="ta" select="document('TranscriberAdmin-en-1.2-ta.xml')"/>
	<xsl:variable name="ar" select="document('TranscriberAdmin-en-1.2-ar.xml')"/>
	<xsl:variable name="es" select="document('TranscriberAdmin-en-1.2-es.xml')"/>
	<xsl:variable name="ha" select="document('TranscriberAdmin-en-1.2-ha.xml')"/>
	<xsl:variable name="id" select="document('TranscriberAdmin-en-1.2-id.xml')"/>
	<xsl:variable name="ru" select="document('TranscriberAdmin-en-1.2-ru.xml')"/>
	<xsl:variable name="sw" select="document('TranscriberAdmin-en-1.2-sw.xml')"/>
	
	<xsl:output indent="yes"/>
	
	<xsl:template match="/">
		<strings>
			<xsl:for-each select="//xliff:trans-unit[not(substring-before(@id,'.') = preceding::xliff:trans-unit/substring-before(@id,'.'))]">
				<xsl:variable name="section" select="substring-before(@id,'.')"/>
				<xsl:element name="{$section}">
					<xsl:copy-of select="$en//*[local-name() = $section]/en"/>
					<xsl:copy-of select="$fr//*[local-name() = $section]/fr"/>
					<xsl:copy-of select="$pt//*[local-name() = $section]/pt"/>
					<xsl:copy-of select="$ta//*[local-name() = $section]/ta"/>
					<xsl:copy-of select="$ar//*[local-name() = $section]/ar"/>
					<xsl:copy-of select="$es//*[local-name() = $section]/es"/>
					<xsl:copy-of select="$ha//*[local-name() = $section]/ha"/>
					<xsl:copy-of select="$id//*[local-name() = $section]/id"/>
					<xsl:copy-of select="$ru//*[local-name() = $section]/ru"/>
					<xsl:copy-of select="$sw//*[local-name() = $section]/sw"/>
				</xsl:element>
			</xsl:for-each>
		</strings>
	</xsl:template>
</xsl:stylesheet>