const transcriptionEaf = () => `<?xml version="1.0" encoding="utf-8"?>
<ANNOTATION_DOCUMENT AUTHOR="" DATE="2011-06-24T16:18:11-08:00" FORMAT="3.0" VERSION="3.0"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:noNamespaceSchemaLocation="../../../EAFv3.0gt.xsd">
	<HEADER MEDIA_FILE="" TIME_UNITS="milliseconds">
		<MEDIA_DESCRIPTOR MEDIA_URL="sound.wav" MIME_TYPE="audio/x-wav"/>
		<PROPERTY NAME="lastUsedAnnotationId">1</PROPERTY>
	</HEADER>
	<TIME_ORDER>
		<TIME_SLOT TIME_SLOT_ID="ts1" TIME_VALUE="0"/>
		<TIME_SLOT TIME_SLOT_ID="ts2" TIME_VALUE="9000"/>
	</TIME_ORDER>
	<TIER DEFAULT_LOCALE="en" LINGUISTIC_TYPE_REF="Transcription" TIER_ID="Transcription">
		<ANNOTATION>
			<ALIGNABLE_ANNOTATION ANNOTATION_ID="a1" TIME_SLOT_REF1="ts1" TIME_SLOT_REF2="ts2">
				<ANNOTATION_VALUE/>
			</ALIGNABLE_ANNOTATION>
		</ANNOTATION>
	</TIER>
	<LINGUISTIC_TYPE GRAPHIC_REFERENCES="false" LINGUISTIC_TYPE_ID="Transcription" TIME_ALIGNABLE="true"/>
	<LOCALE LANGUAGE_CODE="en"/>
	<CONSTRAINT DESCRIPTION="Time subdivision of parent annotation's time interval, no time gaps allowed within this interval" STEREOTYPE="Time_Subdivision"/>
	<CONSTRAINT DESCRIPTION="Symbolic subdivision of a parent annotation. Annotations refering to the same parent are ordered" STEREOTYPE="Symbolic_Subdivision"/>
	<CONSTRAINT DESCRIPTION="1-1 association with a parent annotation" STEREOTYPE="Symbolic_Association"/>
	<CONSTRAINT DESCRIPTION="Time alignable annotations within the parent annotation's time interval, gaps are allowed" STEREOTYPE="Included_In"/>
</ANNOTATION_DOCUMENT>`;

export default transcriptionEaf;
