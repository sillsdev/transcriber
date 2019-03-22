<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:rng="http://relaxng.org/ns/structure/1.0"  version="1.0">
	
	<xsl:output  method="text"/>
	<xsl:variable name="uc">ABCDEFGHIJKLMNOPQRSTUVWXYZ</xsl:variable>
	<xsl:variable name="lc">abcdefghijklmnopqrstuvwxyz</xsl:variable>
	
	<xsl:template match="rng:element|rng:attribute">
		<xsl:choose>
			<xsl:when test="parent::*[local-name() = 'zeroOrMore' or local-name() = 'oneOrMore']/parent::*/@name = 'models' or parent::*/@name = 'models'">
				<xsl:text>CREATE TABLE </xsl:text>
				<xsl:value-of select="translate(@name,$uc,$lc)"/>
				<xsl:text> (&#10;</xsl:text>
				<xsl:apply-templates/>
				<xsl:if test="not(descendant::*[@name='relationships'])">
					<xsl:text>);&#10;</xsl:text>
				</xsl:if>
			</xsl:when>
			<xsl:when test="@name = 'keys' or @name = 'attributes' or @name = 'links' or @name = 'transcriberSettings'">
				<xsl:apply-templates/>
			</xsl:when>
			<xsl:when test="@name = 'relationships'">
				<xsl:for-each select="descendant::rng:element[rng:element]">
					<xsl:text>    </xsl:text>
					<xsl:value-of select="translate(@name,$uc,$lc)"/>
					<xsl:value-of select="substring('                       ', string-length(@name))"/>
					<xsl:text>uuid REFERENCES </xsl:text>
					<xsl:value-of select="descendant::rng:value"/>
					<xsl:text> (id)</xsl:text>
					<xsl:text>,&#10;</xsl:text>
				</xsl:for-each>
				<xsl:text>);&#10;</xsl:text>
				<xsl:for-each select="descendant::rng:element[not(rng:element) and @name != 'data']">
					<xsl:text>CREATE TABLE </xsl:text>
					<xsl:value-of select="ancestor::rng:element[parent::*/parent::*/@name='models']/@name"/>
					<xsl:value-of select="descendant::rng:value"/>
					<xsl:text> (&#10;</xsl:text>
					<xsl:text>    </xsl:text>
					<xsl:value-of select="ancestor::rng:element[parent::*/parent::*/@name='models']/@name"/>
					<xsl:value-of select="substring('                       ', string-length(ancestor::rng:element[parent::*/parent::*/@name='models']/@name))"/>
					<xsl:text>uuid,&#10;</xsl:text>					
					<xsl:text>    </xsl:text>
					<xsl:value-of select="descendant::rng:value"/>
					<xsl:value-of select="substring('                       ', string-length(descendant::rng:value))"/>
					<xsl:text>uuid,&#10;</xsl:text>
					<xsl:text>    PRIMARY KEY (</xsl:text>
					<xsl:value-of select="ancestor::rng:element[parent::*/parent::*/@name='models']/@name"/>
					<xsl:text>, </xsl:text>					
					<xsl:value-of select="descendant::rng:value"/>
					<xsl:text>)&#10;</xsl:text>
					<xsl:text>);&#10;</xsl:text>
				</xsl:for-each>
			</xsl:when>
			<xsl:when test="ancestor::*/@name = 'models' and @name != 'type'">
				<xsl:text>    </xsl:text>
				<xsl:value-of select="translate(@name,$uc,$lc)"/>
				<xsl:value-of select="substring('                       ', string-length(@name))"/>
				<!-- xsl:value-of select="rng:data/@type"/ -->
				<xsl:choose>
					<xsl:when test="rng:data/@type = 'string'">
						<xsl:text>varchar(40)</xsl:text>
					</xsl:when>
					<xsl:when test="rng:data/@type = 'NCName'">
						<xsl:text>varchar(40) UNIQUE</xsl:text>
					</xsl:when>
					<xsl:when test="(rng:data/@type = 'decimal' or rng:data/@type = 'integer') and not (descendant::rng:param)">
						<xsl:text>integer</xsl:text>
					</xsl:when>
					<xsl:when test="(rng:data/@type = 'decimal' or rng:data/@type = 'integer') and descendant::rng:param">
						<xsl:text>integer</xsl:text>
						<xsl:text> CHECK (</xsl:text>
						<xsl:for-each select="descendant::rng:param">
							<xsl:choose>
								<xsl:when test="@name = 'minInclusive'">
									<xsl:value-of select="parent::*/parent::*/@name"/>
									<xsl:text> &gt;= </xsl:text>
									<xsl:value-of select="text()"/>
								</xsl:when>
								<xsl:when test="@name = 'maxInclusive'">
									<xsl:value-of select="parent::*/parent::*/@name"/>
									<xsl:text> &lt;= </xsl:text>
									<xsl:value-of select="text()"/>
								</xsl:when>
							</xsl:choose>
							<xsl:if test="not(position() = last())">
								<xsl:text> and </xsl:text>
							</xsl:if>
						</xsl:for-each>
						<xsl:text>)</xsl:text>
					</xsl:when>
					<xsl:when test="rng:data/@type = 'positiveInteger'">
						<xsl:text>integer CHECK (</xsl:text>
						<xsl:value-of select="@name"/>
						<xsl:text> &gt; 0)</xsl:text>
					</xsl:when>
					<xsl:when test="rng:data/@type = 'nonNegativeInteger'">
						<xsl:text>integer CHECK (</xsl:text>
						<xsl:value-of select="@name"/>
						<xsl:text> &gt;= 0)</xsl:text>
					</xsl:when>
					<xsl:when test="rng:data/@type = 'dateTime'">
						<xsl:text>timestamp</xsl:text>
					</xsl:when>
					<xsl:when test="rng:data/@type = 'anyURI'">
						<xsl:text>varchar(100)</xsl:text>
					</xsl:when>
					<xsl:when test="rng:data/@type = 'ID'">
						<xsl:text>uuid</xsl:text>
						<xsl:if test="@name = 'id'">
							<xsl:text> NOT NULL DEFAULT uuid_generate_v4()</xsl:text>
						</xsl:if>
					</xsl:when>
					<xsl:when test="rng:data/@type = 'boolean'">
						<xsl:text>boolean</xsl:text>
					</xsl:when>
					<xsl:when test="child::*[local-name() = 'choice']">
						<xsl:text>char(10)</xsl:text>
					</xsl:when>
				</xsl:choose>
				<xsl:text>,&#10;</xsl:text>
			</xsl:when>
			<xsl:otherwise>
				<xsl:apply-templates/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	
	<xsl:template match="text()"/>
</xsl:stylesheet>