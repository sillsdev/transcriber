<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="2.0">

	<xsl:output indent="yes"/>

	<xsl:template match="/">
		<xsl:apply-templates/>
	</xsl:template>

	<xsl:template match="project">
		<xsl:result-document href="setting-{parent::*/username/@id}-{@id}.xml">
			<xsl:processing-instruction name="xml-model">href="setting.rnc" type="application/relax-ng-compact-syntax"</xsl:processing-instruction>
			<xsl:element name="setting">
				<xsl:attribute name="type">setting</xsl:attribute>
				<xsl:attribute name="id">
					<xsl:value-of select="parent::*/username/@id"/>
					<xsl:text>-</xsl:text>
					<xsl:value-of select="@id"/>
				</xsl:attribute>
				<xsl:element name="meta">
					<xsl:attribute name="version">1.0</xsl:attribute>
				</xsl:element>
				<xsl:element name="attributes">
					<xsl:attribute name="role">
						<xsl:value-of select="parent::*/role/text()"/>
					</xsl:attribute>
					<xsl:attribute name="fontFamily">
						<xsl:value-of select="fontfamily"/>
					</xsl:attribute>
					<xsl:if test="count(fontfeatures) != 0">
						<xsl:attribute name="fontFeatures">
							<xsl:value-of select="fontfeatures"/>
						</xsl:attribute>
					</xsl:if>
					<xsl:attribute name="fontSize">
						<xsl:value-of select="fontsize"/>
					</xsl:attribute>
				</xsl:element>
				<xsl:element name="relationships">
					<xsl:element name="user">
						<xsl:element name="data">
							<xsl:attribute name="type">user</xsl:attribute>
							<xsl:attribute name="id">
								<xsl:value-of select="parent::*/username/@id"/>
							</xsl:attribute>
						</xsl:element>
					</xsl:element>
					<xsl:element name="project">
						<xsl:element name="data">
							<xsl:attribute name="type">project</xsl:attribute>
							<xsl:attribute name="id">
								<xsl:value-of select="@id"/>
							</xsl:attribute>
						</xsl:element>
					</xsl:element>
				</xsl:element>
			</xsl:element>
		</xsl:result-document>
	</xsl:template>

	<xsl:template match="text()"/>
</xsl:stylesheet>
