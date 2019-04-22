# Localization

Localization is set up to work with crowd-in generated strings. When crowd-in translations are downloaded, a zip file is containing a folder for each localization where the file in the folder is the English file: `TranscriberAdmin-en-1.2.xliff` with the stings inserted as target and the language set in the header. This file can be unzipped so its sub-folders appear here.

<blockquote>
NB: The work was done using OxygenXml but could be done with other Xml editing tools that support the XSLT 2.0 transformation process.
</blockquote>

### Adding localization strings
1. Edit TranscriberAdmin-en-1.2.xliff adding a new `<trans-unit>` element for each string. This element should have an id filed with two parts: the context followed by a camel case string id. The string itself is given as source and the file name containing the string is given in the `<context-group>` following the example.

<blockquote>NB: currently the context is the name of the component (or route) that contains the string.</blockquote>

<blockquote>NB: When strings are added to this file, the same information must be inserted into the dev-team translations.</blockquote>

### Udating dev-team translations
The translations of the development team are created using Microsoft terminology, demoL (German site), or Google translate. They provide a rough view for users until a professional translation is completed. These translations are kept in Xliff 2.0 files with the extension .xlf. (ex: `TranscriberAdmin-fr.xlf`)

<blockquote>NB: There is a naming conventions which has the BCP-47 code as the last two characters of the name.</blockquote>

When new strings are added to the localation strings file, they must also be added to these files. This can be done using the following two processes.

##### Creating TranscriberAdmin-en.xlf
1. Right click on `TranscriberAdmin-en-1.2.xliff`
2. Choose `Transform`
3. Choose `Transform With...`
4. Choose `From12To20`

##### Adding to other local translations
1. Use Tools Compare files
2. Click open folder for left file.
3. Type `*.xlf` in the name.
4. Select the `TranscriberAdmin-en.xlf`
5. Click open folder for right file.
6. Type `*.xlf` in the name
7. Choose the target file (ex. `TranscriberAdmin-fr.xlf`)
8. Scroll down to a grey area and click on it.
9. Click the arrow on the right grey area to insert it.
10. Repeat for each area and each file.

##### Insert new translation proposals
You will want to go through the non-English files and use the internet tools to insert proposed strings: [Microsoft Terminology](https://www.microsoft.com/en-us/language/Search?&searchTerm=List%20Options&langID=303&Source=true&productid=undefined), [German tool](https://www.deepl.com/translator), or [Google Translate](https://translate.google.com).

### Updating model
1. Right click on `TranscriberAdmin-en-1.2.xliff`
2. Choose `Transform`
3. Choose `Transform With...`
4. Choose `ToModel`
5. Move generated `localizeModel.tsx` to `model` folder

### Updating reducer
1. Right click on `TranscriberAdmin-en-1.2.xliff`
2. Choose `Transform`
3. Choose `Transform With...`
4. Choose `ToReducer`
5. Move generated `localizationReducer.tsx` to `reducer` folder

### Updating strings.json
The strings.json file is created by processing each language with MakeStrings-12.xsl and then combining them all with CombineStrings-12.xsl. The resulting file is edited to remove the outermost name.

##### Generating the English Strings file
1. Right click on `TranscriberAdmin-en-1.2.xliff`
2. Choose `Transform`
3. Choose `Transform With...`
4. Choose `TranscriberAdmin-en`

##### Generating the strings file for another language with dummy crowdin file
1. create a folder for the language (ex. fr)
2. copy `TranscriberAdmin-en-1.2.xliff` into the folder.
3. Drag `TranscriberAdmin-en-1.2.xliff` into OxygenXml editor
4. Change the `target-language` attribute value to the language tag (ex. `fr`)
5. Select `Configure Transform Scenarios` from the tool bar.
6. Make sure only `TranscriberAdmin-en-fr` is selected
7. click `Apply` button
8. `TranscriberAdmin-en-1.2-fr.xml` will be created in the `localization` folder. Rename if necessary to correct the language tag.
9. Right click on `TranscriberAdmin-en-1.2.xliff`
10. Choose `Transform`
11. Choose `Transform With...`
12. Choose `CombineStrings`
13. On the menu, choose `Tools` then `Xml to Json`
14. Select the `strings.xml` file from the drop down.
15. Remove `{"strings":` from the beginning and a `}` from the end.
16. Save the resulting `strings.json` file.
17. Move `strings.json` from the `localization` folder to the `public\localization` folder
18. Clean up by removing the `*.xml` files generated from the `localization` folder.

### Adding a new language
When a new language is to be added, the `CombineStrings-12.xsl` will need to be edited to include a new `<xsl:variable>` at the top and a new `<xsl:copy-of>` element to include the resulting strings.