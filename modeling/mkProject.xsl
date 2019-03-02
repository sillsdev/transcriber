<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

	<xsl:output indent="yes"/>

	<xsl:template match="/">
		<xsl:processing-instruction name="xml-model">href="project.rnc" type="application/relax-ng-compact-syntax"</xsl:processing-instruction>
		<xsl:element name="data">
			<xsl:apply-templates/>
		</xsl:element>
	</xsl:template>

	<xsl:template match="project">
		<xsl:element name="project">
			<xsl:attribute name="type">project</xsl:attribute>
			<xsl:attribute name="id">
				<xsl:value-of select="@id"/>
			</xsl:attribute>
			<xsl:element name="meta">
				<xsl:attribute name="version">1.0</xsl:attribute>
			</xsl:element>
			<xsl:element name="attributes">
				<xsl:attribute name="name">
					<xsl:value-of select="@name"/>
				</xsl:attribute>
				<xsl:attribute name="languageBcp47">
					<xsl:value-of select="@lang"/>
				</xsl:attribute>
				<xsl:if test="not(starts-with(@id, 'ztt'))">
					<xsl:attribute name="paratextShortName">
						<xsl:value-of select="@id"/>
					</xsl:attribute>
					<xsl:attribute name="paratextGuid">
						<xsl:value-of select="@guid"/>
					</xsl:attribute>
				</xsl:if>
				<xsl:attribute name="autoSync">
					<xsl:value-of select="@sync"/>
				</xsl:attribute>
				<xsl:attribute name="allowClaiming">
					<xsl:value-of select="@claim"/>
				</xsl:attribute>
			</xsl:element>
			<xsl:element name="relationships">
				<xsl:element name="passages">
					<xsl:for-each select="task">
						<xsl:element name="data">
							<xsl:attribute name="type">passage</xsl:attribute>
							<xsl:attribute name="id">
								<xsl:value-of select="@id"/>
							</xsl:attribute>
						</xsl:element>
				</xsl:for-each>
				</xsl:element>
			</xsl:element>
		</xsl:element>
	</xsl:template>
	
	<xsl:template match="text()"/>
</xsl:stylesheet>
