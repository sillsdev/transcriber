<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="2.0">

	<xsl:output indent="yes"/>

	<xsl:template match="/">
		<xsl:apply-templates/>
	</xsl:template>

	<xsl:template match="task">
		<xsl:result-document href="version-{@id}v001.xml">
			<xsl:processing-instruction name="xml-model">href="version.rnc" type="application/relax-ng-compact-syntax"</xsl:processing-instruction>
			<xsl:element name="version">
				<xsl:attribute name="type">version</xsl:attribute>
				<xsl:attribute name="id">
					<xsl:value-of select="@id"/>
					<xsl:text>v001</xsl:text>
				</xsl:attribute>
				<xsl:element name="meta">
					<xsl:attribute name="version">1.0</xsl:attribute>
				</xsl:element>
				<xsl:element name="attributes">
					<xsl:attribute name="number">1</xsl:attribute>
					<xsl:attribute name="duration">
						<xsl:value-of select="@length"/>
					</xsl:attribute>
				</xsl:element>
				<xsl:element name="links">
					<xsl:attribute name="eafUrl">
						<xsl:text>audio/</xsl:text>
						<xsl:value-of select="@id"/>
						<xsl:text>v001.eaf</xsl:text>
					</xsl:attribute>
					<xsl:attribute name="audioUrl">
						<xsl:text>audio/</xsl:text>
						<xsl:value-of select="@id"/>
						<xsl:text>v001.mp3</xsl:text>
					</xsl:attribute>
				</xsl:element>
				<xsl:element name="relationships">
					<xsl:element name="passage">
						<xsl:element name="data">
							<xsl:attribute name="type">passage</xsl:attribute>
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
