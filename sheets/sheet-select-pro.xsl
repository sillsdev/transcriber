<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

	<xsl:output method="text"/>

	<xsl:template match="/">
		<xsl:apply-templates select="usx"/>
	</xsl:template>

	<xsl:template match="usx">
		<xsl:text>Set #,Title in NIV,Passage,Book,Breaks,Description&#10;</xsl:text>
		<xsl:apply-templates select="para | chapter[@number]"/>
	</xsl:template>

	<xsl:template match="para" mode="psg">
		<xsl:choose>
			<xsl:when test="starts-with(@style, 'p') or starts-with(@style, 'li') or @style = 'q1'">
				<xsl:if test="verse/@number">
					<xsl:text>p</xsl:text>
				</xsl:if>
				<xsl:if test="local-name(preceding-sibling::*[1]) = 'para'">
					<xsl:apply-templates select="preceding-sibling::para[1]" mode="psg"/>
				</xsl:if>
			</xsl:when>
			<xsl:when test="starts-with(@style, 'q') or starts-with(@style, 'm')">
				<xsl:if test="local-name(preceding-sibling::*[1]) = 'para'">
					<xsl:apply-templates select="preceding-sibling::para[1]" mode="psg"/>
				</xsl:if>
			</xsl:when>
		</xsl:choose>
	</xsl:template>

	<xsl:template match="para">
		<xsl:variable name="psgCount">
			<xsl:if test="local-name(preceding-sibling::*[1]) = 'para'">
				<xsl:apply-templates select="preceding-sibling::para[1]" mode="psg"/>
			</xsl:if>
		</xsl:variable>
		<xsl:choose>
			<xsl:when test="starts-with(@style,'s') or starts-with(@style, 'b') ">
				<xsl:if test="not(following-sibling::para[1][starts-with(@style,'s')])">
					<xsl:value-of
						select="count(preceding-sibling::para[starts-with(@style,'s') or @style='b']/following-sibling::*[1][substring(@style,1,1)!='s'] | preceding-sibling::chapter[@number]/following-sibling::*[1][substring(@style,1,1)!='s']) + 1"/>
					<xsl:text>,</xsl:text>
					<xsl:for-each select="node()">
						<xsl:value-of select="."/>	
					</xsl:for-each>
					<xsl:text>,</xsl:text>
					<xsl:text>,</xsl:text>
					<xsl:text>,</xsl:text>
					<xsl:text>,</xsl:text>
					<xsl:text>&#10;</xsl:text>
				</xsl:if>
			</xsl:when>
			<xsl:when
				test="starts-with(@style, 'p') or starts-with(@style, 'li') or starts-with(@style, 'q1')">
				<xsl:if test="verse/@number[1]">
					<xsl:text>,</xsl:text>
					<xsl:text>,</xsl:text>
					<xsl:value-of select="string-length($psgCount)+1"/>
					<xsl:text>,</xsl:text>
					<xsl:value-of select="preceding::book/@code"/>
					<xsl:text>,</xsl:text>
					<xsl:value-of select="preceding-sibling::chapter[1]/@number"/>
					<xsl:text>:</xsl:text>
					<xsl:value-of select="verse/@number[1]"/>
					<xsl:text>-</xsl:text>
					<xsl:variable name="nums" select="verse/@number"/>
					<xsl:variable name="numCount" select="count($nums)"/>
					<xsl:value-of select="$nums[$numCount]"/>
					<xsl:text>,</xsl:text>
					<xsl:text>&#10;</xsl:text>
				</xsl:if>
			</xsl:when>
		</xsl:choose>
	</xsl:template>

	<xsl:template match="chapter[@number]">
		<xsl:if test="not(following-sibling::para[1][starts-with(@style,'s')])">
			<xsl:value-of
				select="count(preceding-sibling::para[starts-with(@style,'s') or @style='b']/following-sibling::*[1][substring(@style,1,1)!='s'] | preceding-sibling::chapter[@number]/following-sibling::*[1][substring(@style,1,1)!='s']) + 1"/>
			<xsl:text>,</xsl:text>
			<xsl:variable name="secs" select="preceding-sibling::para[starts-with(@style,'s')]"/>
			<xsl:variable name="secsCount" select="count($secs)"/>
			<xsl:for-each select="$secs[$secsCount]/node()">
				<xsl:value-of select="."/>	
			</xsl:for-each>
			<xsl:text>,</xsl:text>
			<xsl:text>,</xsl:text>
			<xsl:text>,</xsl:text>
			<xsl:text>,</xsl:text>
			<xsl:text>&#10;</xsl:text>
		</xsl:if>
	</xsl:template>


</xsl:stylesheet>
