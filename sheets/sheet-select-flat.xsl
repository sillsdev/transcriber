<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	version="1.0">
	
	<xsl:output method="text"/>
	
	<xsl:template match="/">
		<xsl:apply-templates select="usx"/>
	</xsl:template>
	
	<xsl:template match="usx">
		<xsl:text>Set #,Title in NIV,Book,Breaks,Description&#10;</xsl:text>
		<xsl:if test="count(para[starts-with(@style,'s')]) = 0">
			<xsl:message>
				<xsl:value-of select="book/@code"/>
				<xsl:text>&#xa0;has no sections use the conversion for flat proverbs</xsl:text>
			</xsl:message>
		</xsl:if>			
		<xsl:apply-templates select="para | chapter[@number]"/>
	</xsl:template>
	
	<xsl:template name="chapterCheck">
		<xsl:choose>
			<xsl:when test="local-name(following-sibling::*[1]) = 'chapter'">
				<xsl:value-of select="(preceding::verse/@number)[last()]"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:apply-templates select="following-sibling::para[1]" mode="sct"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	
	<xsl:template match="para" mode="sct">
		<xsl:choose>
			<xsl:when
				test="starts-with(@style, 'p') or starts-with(@style, 'li') or starts-with(@style, 'q') or starts-with(@style, 'm') or @style = 'b'">
				<xsl:call-template name="chapterCheck"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="(preceding::verse/@number)[last()]"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	
	<xsl:template match="para">
		<xsl:choose>
			<xsl:when test="starts-with(@style,'s')">
				<xsl:value-of select="count(preceding-sibling::para[starts-with(@style,'s')]) + 1"/>
				<xsl:text>,</xsl:text>
				<xsl:for-each select="node()">
					<xsl:value-of select="."/>	
				</xsl:for-each>
				<xsl:text>,</xsl:text>
				<xsl:value-of select="preceding::book/@code"/>
				<xsl:text>,</xsl:text>
				<xsl:value-of select="preceding-sibling::chapter[1]/@number"/>
				<xsl:text>:</xsl:text>
				<xsl:value-of select="following::verse/@number[1]"/>
				<xsl:text>-</xsl:text>
				<xsl:call-template name="chapterCheck"/>
				<xsl:text>,</xsl:text>
				<xsl:text>&#10;</xsl:text>
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
			<xsl:value-of select="preceding::book/@code"/>
			<xsl:text>,</xsl:text>
			<xsl:value-of select="@number"/>
			<xsl:text>:</xsl:text>
			<xsl:value-of select="following::verse/@number[1]"/>
			<xsl:text>-</xsl:text>
			<xsl:call-template name="chapterCheck"/>
			<xsl:text>,</xsl:text>
			<xsl:text>&#10;</xsl:text>
		</xsl:if>
	</xsl:template>
	
</xsl:stylesheet>