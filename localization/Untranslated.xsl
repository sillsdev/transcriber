<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xlf="urn:oasis:names:tc:xliff:document:2.0" 
    version="1.0">
    
    <xsl:template match="/">
        <xsl:apply-templates select="xlf:target"/>
    </xsl:template>
    
    <xsl:template match="xlf:target">
        <xsl:if test="parent::*/xlf:source/text() = text()">
            <xsl:message><xsl:value-of select="parent::*/@id"/></xsl:message>
        </xsl:if>
    </xsl:template>
</xsl:stylesheet>