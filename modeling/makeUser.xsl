<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
	
	<xsl:output indent="yes"/>

	<xsl:template match="/">
		<xsl:processing-instruction name="xml-model">href="user.rnc" type="application/relax-ng-compact-syntax"</xsl:processing-instruction>
		<xsl:element name="data">
			<xsl:apply-templates/>
		</xsl:element>
	</xsl:template>

	<xsl:template match="user">
		<xsl:element name="user">
			<xsl:attribute name="type">user</xsl:attribute>
			<xsl:attribute name="id">
				<xsl:value-of select="username/@id"/>
			</xsl:attribute>
			<xsl:element name="meta">
				<xsl:attribute name="version">1.0</xsl:attribute>
			</xsl:element>
			<xsl:element name="attributes">
				<xsl:attribute name="id">
					<xsl:value-of select="username/@id"/>
				</xsl:attribute>
				<xsl:element name="fullName">
					<xsl:value-of select="username/fullname"/>
				</xsl:element>
				<xsl:element name="transcriberSettings">
					<xsl:attribute name="uiLanguageBcp47">
						<xsl:value-of select="uilang"/>
					</xsl:attribute>
					<xsl:attribute name="timer">
						<xsl:value-of select="timer"/>
					</xsl:attribute>
					<xsl:attribute name="playBackSpeed">
						<xsl:value-of select="speed"/>
					</xsl:attribute>
					<xsl:attribute name="progressBarType">
						<xsl:value-of select="progress"/>
					</xsl:attribute>
					<xsl:for-each select="hotKey">
						<xsl:element name="hotkey">
							<xsl:attribute name="hotKeyType">
								<xsl:value-of select="@id"/>
							</xsl:attribute>
							<xsl:attribute name="keyCode">
								<xsl:value-of select="text()"/>
							</xsl:attribute>
						</xsl:element>
					</xsl:for-each>
				</xsl:element>
			</xsl:element>
			<xsl:element name="links">
				<xsl:element name="avatarUrl">
					<xsl:value-of select="username/avatarUri"/>
				</xsl:element>
			</xsl:element>
			<xsl:element name="relationships">
				<xsl:for-each select="project">
					<xsl:element name="lastTranscriberProject">
						<xsl:element name="data">
							<xsl:attribute name="type">project</xsl:attribute>
							<xsl:attribute name="id">
								<xsl:value-of select="parent::*/project/@id"/>
							</xsl:attribute>
						</xsl:element>
					</xsl:element>
					<xsl:element name="settings">
						<xsl:element name="data">
							<xsl:attribute name="type">setting</xsl:attribute>
							<xsl:attribute name="id">
								<xsl:value-of select="parent::*/username/@id"/>
								<xsl:text>-</xsl:text>
								<xsl:value-of select="parent::*/project/@id"/>
							</xsl:attribute>
						</xsl:element>
					</xsl:element>
				</xsl:for-each>
				<xsl:if test="count(setting[@lastTask]) != 0">
					<xsl:element name="lastTranscriberPassage">
						<xsl:element name="data">
							<xsl:attribute name="type">passage</xsl:attribute>
							<xsl:attribute name="id">
								<xsl:value-of select="setting[@lastTask]/text()"/>
							</xsl:attribute>
						</xsl:element>
					</xsl:element>
				</xsl:if>
			</xsl:element>
		</xsl:element>
	</xsl:template>
</xsl:stylesheet>
