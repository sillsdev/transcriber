<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

	<xsl:output indent="yes"/>

	<xsl:template match="/">
		<xsl:processing-instruction name="xml-model">href="passage.rnc" type="application/relax-ng-compact-syntax"</xsl:processing-instruction>
		<xsl:element name="data">
			<xsl:apply-templates/>
		</xsl:element>
	</xsl:template>

	<xsl:template match="task">
		<xsl:element name="passage">
			<xsl:attribute name="type">passage</xsl:attribute>
			<xsl:attribute name="id">
				<xsl:value-of select="@id"/>
			</xsl:attribute>
			<xsl:element name="meta">
				<xsl:attribute name="version">1.0</xsl:attribute>
			</xsl:element>
			<xsl:element name="attributes">
				<xsl:attribute name="reference">
					<xsl:value-of select="reference/text()"/>
				</xsl:attribute>
				<xsl:attribute name="book">
					<xsl:if test="starts-with(reference/text(),'LUK')">42</xsl:if>
				</xsl:attribute>
				<xsl:attribute name="set">1</xsl:attribute>
				<xsl:attribute name="passage">
					<xsl:value-of select="count(preceding-sibling::task) + 1"/>
				</xsl:attribute>
				<xsl:if test="count(@position) != 0">
					<xsl:attribute name="position">
						<xsl:value-of select="@position"/>
					</xsl:attribute>
				</xsl:if>
				<xsl:attribute name="state">
					<xsl:value-of select="@state"/>
				</xsl:attribute>
				<xsl:if test="count(@hold) != 0">
					<xsl:attribute name="hold">
						<xsl:value-of select="@hold"/>
					</xsl:attribute>
				</xsl:if>
			</xsl:element>
			<xsl:element name="relationships">
				<xsl:if test="count(@assignedto) != 0">
					<xsl:element name="assignedTo">
						<xsl:element name="data">
							<xsl:attribute name="type">user</xsl:attribute>
							<xsl:attribute name="id">
								<xsl:value-of select="@assignedto"/>
							</xsl:attribute>
						</xsl:element>
					</xsl:element>
				</xsl:if>
				<xsl:if test="count(history[last()]/@userid) != 0">
					<xsl:element name="lastTranscriber">
						<xsl:element name="data">
							<xsl:attribute name="type">user</xsl:attribute>
							<xsl:attribute name="id">
								<xsl:value-of select="history[last()]/@userid"/>
							</xsl:attribute>
						</xsl:element>
					</xsl:element>
				</xsl:if>
				<xsl:element name="versions">
					<xsl:element name="data">
						<xsl:attribute name="type">version</xsl:attribute>
						<xsl:attribute name="id">
							<xsl:value-of select="@id"/>
							<xsl:text>v001</xsl:text>
						</xsl:attribute>
					</xsl:element>
				</xsl:element>
				<xsl:if test="count(history) != 0">
					<xsl:element name="events">
						<xsl:for-each select="history">
						<xsl:element name="data">
							<xsl:attribute name="type">event</xsl:attribute>
							<xsl:attribute name="id">
								<xsl:value-of select="parent::*/@id"/>
								<xsl:text>-</xsl:text>
								<xsl:value-of select="@id"/>
							</xsl:attribute>
						</xsl:element>
						</xsl:for-each>
					</xsl:element>
				</xsl:if>
			</xsl:element>
		</xsl:element>
	</xsl:template>
	
	<xsl:template match="text()"/>
</xsl:stylesheet>
