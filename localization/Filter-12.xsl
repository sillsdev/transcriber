<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns="urn:oasis:names:tc:xliff:document:2.0"
	xmlns:ns12="urn:oasis:names:tc:xliff:document:1.2"
	xmlns:ns20="urn:oasis:names:tc:xliff:document:2.0"
	version="1.0">
	
	<xsl:param name="names" select="document('nameList.xml')"/>
	
	<xsl:output method="xml" encoding="UTF-8" indent="yes"/>
	<xsl:template match="ns12:xliff">
		<xsl:copy>
			<xsl:apply-templates select="@*" mode="all"/>
			<xsl:apply-templates select="ns12:file"/>
		</xsl:copy>
	</xsl:template>
	<xsl:template match="ns12:file">
		<xsl:copy>
			<xsl:apply-templates select="@*" mode="all"/>
			<xsl:apply-templates select="ns12:body"/>
		</xsl:copy>
	</xsl:template>
	<xsl:template match="ns12:body">
		<xsl:copy>
			<xsl:apply-templates select="@*" mode="all"/>
			<xsl:apply-templates select="ns12:trans-unit" mode="unit">
				<xsl:sort select="@id"/>
			</xsl:apply-templates>
		</xsl:copy>
	</xsl:template>
	<xsl:template match="*" mode="unit">
		<xsl:variable name="name" select="substring-after(@id,'.')"/>
		<xsl:if test="$names//n/text() = $name">
			<xsl:copy>
				<xsl:apply-templates select="@*" mode="all"/>
				<xsl:for-each select="*">
					<xsl:choose>
						<xsl:when test="local-name() = 'context-group'">
							<xsl:copy>
								<xsl:apply-templates select="*|@*" mode='all'/>	
							</xsl:copy>
						</xsl:when>
						<xsl:otherwise>
							<xsl:copy>
								<xsl:apply-templates select="node()|@*" mode='all'/>	
							</xsl:copy>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:for-each>
			</xsl:copy>
		</xsl:if>
	</xsl:template>
	<xsl:template match="node()|@*" mode="all">
		<xsl:copy>
			<xsl:apply-templates select="@*|node()" mode='all'/>
		</xsl:copy>
	</xsl:template>
</xsl:stylesheet>