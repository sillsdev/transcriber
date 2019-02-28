<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:rng="http://relaxng.org/ns/structure/1.0" version="1.0">
	
	<xsl:output indent="yes"/>
	
	<xsl:template match="rng:element|rng:attribute">
		<xsl:choose>
			<xsl:when test="count(ancestor::*[@name = 'relationships']) != 0">
				<xsl:if test="@name != 'data'">
					<xsl:element name="{@name}">
						<xsl:choose>
							<xsl:when test="child::rng:zeroOrMore">
								<xsl:element name="type">hasMany</xsl:element>
							</xsl:when>
							<xsl:otherwise>
								<xsl:element name="type">hasOne</xsl:element>
							</xsl:otherwise>
						</xsl:choose>
						<xsl:apply-templates mode="relationship"/>
					</xsl:element>
				</xsl:if>
			</xsl:when>
			<xsl:when test="@name = 'type' or @name = 'id' or @name = 'keys'"/>
			<xsl:otherwise>
				<xsl:element name="{@name}">
					<xsl:apply-templates/>
				</xsl:element>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template match="rng:data">
		<xsl:element name="type">
			<xsl:value-of select="@type"/>
		</xsl:element>
	</xsl:template>
	
	<xsl:template match="rng:choice[rng:value]">
		<xsl:element name="type">string</xsl:element>
	</xsl:template>
	
	<xsl:template mode="relationship" match="*[@name='type']">
		<xsl:element name="model">
			<xsl:value-of select="rng:value"/>
		</xsl:element>
	</xsl:template>
	
	<xsl:template match="text()"/>
	<xsl:template match="text()" mode="relationship"/>
</xsl:stylesheet>
