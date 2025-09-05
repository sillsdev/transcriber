# BurritoBuilder class

can create burrito JSON objects similar to the one in audioBurrito.ts. The
builder:

1. Uses TypeScript interfaces to define the structure of each part of the
   burrito
2. Provides fluent builder methods for each section
3. Includes a default template matching the structure in audioBurrito.ts
4. Has an example usage function createAudioBurrito() that creates a burrito
   similar to the example

You can use it like this:

```jsx
// Create a basic burrito
const burrito = new BurritoBuilder()
  .withMeta({
    generator: {
      softwareName: 'MyApp',
      softwareVersion: '1.0.0',
      userName: 'John Doe',
    },
  })
  .withLanguage('en', 'English')
  .build()
```

```jsx
// Or use the example function
const audioBurrito = createAudioBurrito()
```

The builder makes it easy to create valid burrito objects with proper typing and
structure. Each method returns the builder instance for method chaining, and the
build() method returns the final burrito object.

comprehensive unit tests for the BurritoBuilder that:

1. Test default values

2. Test each builder method individually:

- withMeta
- withIdAuthority
- withLanguage
- withFlavor
- withAgency
- withTargetArea
- withLocalizedName
- withIngredient
- withCopyright

3. Test the complete createAudioBurrito function

Each test verifies that:

- The builder methods correctly set values
- The structure matches the expected format = The values are properly nested
- Arrays and objects are correctly populated

The tests use Jest's expect assertions to verify the output structure and
values.
