<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

	<xsl:output indent="yes"/>

	<xsl:template match="/">
		<xsl:processing-instruction name="xml-model">href="event.rnc" type="application/relax-ng-compact-syntax"</xsl:processing-instruction>
		<xsl:element name="data">
			<xsl:apply-templates/>
		</xsl:element>
	</xsl:template>

	<xsl:template match="history">
		<xsl:element name="event">
			<xsl:attribute name="type">event</xsl:attribute>
			<xsl:attribute name="id">
				<xsl:value-of select="parent::*/@id"/>
				<xsl:text>-</xsl:text>
				<xsl:value-of select="@id"/>
			</xsl:attribute>
			<xsl:element name="meta">
				<xsl:attribute name="version">1.0</xsl:attribute>
			</xsl:element>
			<xsl:element name="attributes">
				<xsl:attribute name="historyEntry">
					<xsl:value-of select="@id"/>
				</xsl:attribute>
				<xsl:attribute name="datetime">
					<xsl:value-of select="@datetime"/>
				</xsl:attribute>
				<xsl:attribute name="action">
					<xsl:value-of select="@action"/>
				</xsl:attribute>
				<xsl:element name="comment">
					<xsl:value-of select="comment/text()"/>
				</xsl:element>
			</xsl:element>
			<xsl:element name="relationships">
				<xsl:element name="passage">
					<xsl:element name="data">
						<xsl:attribute name="type">passage</xsl:attribute>
						<xsl:attribute name="id">
							<xsl:value-of select="parent::*/@id"/>
						</xsl:attribute>
					</xsl:element>
				</xsl:element>
				<xsl:element name="assignedUser">
					<xsl:element name="data">
						<xsl:attribute name="type">user</xsl:attribute>
						<xsl:attribute name="id">
							<xsl:value-of select="@userid"/>
						</xsl:attribute>
					</xsl:element>
				</xsl:element>
				<xsl:element name="agent">
					<xsl:element name="data">
						<xsl:attribute name="type">user</xsl:attribute>
						<xsl:attribute name="id">admin</xsl:attribute>
					</xsl:element>
				</xsl:element>
			</xsl:element>
		</xsl:element>
	</xsl:template>
	
	<xsl:template match="text()"/>
</xsl:stylesheet>
