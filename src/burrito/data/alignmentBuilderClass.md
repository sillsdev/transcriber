# AlignmentBuilder class

can create alignment JSON objects similar to the one in audioAlignment.ts. The
builder:

1. Uses TypeScript interfaces to define the structure:

- AlignmentDocument for document entries
- AlignmentRecord for timecode-text reference pairs
- Alignment for the complete structure

2. Provides fluent builder methods:

- withDocument(scheme, docid?) to add document entries
- withRecord(timecode, textReference) to add individual records
- withRecords(records) to add multiple records at once

3. Includes a default template with fixed values:

- format: 'alignment'
- version: '0.3'
- type: 'audio-reference'
- roles: ['timecode', 'text-reference']

4. Has an example usage function createAudioAlignment() that creates an
   alignment matching the example

You can use it like this: Apply to audioAlignme...

```jsx
// Create a basic alignment
const alignment = new AlignmentBuilder()
  .withDocument('vtt-timecode', 'my_audio.mp3')
  .withRecord('00:00.000 --> 00:01.000', 'en+ulb.GEN 1:1')
  .build()
```

```jsx // Or use the example function const audioAlignment =
// Or use the example function
createAudioAlignment()
```

comprehensive test suite for the AlignmentBuilder class. The tests cover:

1. Creating a basic alignment with default values
2. Adding a single document with and without a docid
3. Adding multiple documents
4. Adding a single record
5. Adding multiple records
6. Adding records in bulk using the withRecords method
7. Creating a complete audio alignment using the createAudioAlignment helper
   function

Each test verifies the structure and content of the generated alignment objects,
ensuring that:

- The basic properties (format, version, type, roles) are set correctly
- Documents are added with the correct scheme and docid
- Records are added with the correct timecode and text references
- The bulk record addition works as expected
- The complete audio alignment matches the expected structure from the example

The tests use Jest's expect assertions to verify the output, and they cover both
the builder pattern methods and the helper function. The test cases are designed
to be clear and maintainable, with descriptive names that explain what each test
is verifying.

The AlignmentBuilder has been refactored to support the "groups" format as seen in audioAlignment2.ts:
New interfaces AlignmentGroup and updated Alignment to support an optional groups array.
Added withGroup and withGroups builder methods for adding group-based alignment data.
Maintained backward compatibility: the original documents and records at the root level are still supported.
You can now use AlignmentBuilder to create both the old flat format and the new grouped format. If you need an example usage or want to update the tests to cover the new format, let me know!