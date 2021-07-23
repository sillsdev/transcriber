# Localization

Localization is set up so that CrowdIn translations will be used in preference to translations created by the development team. Currently the code is being localized in French, Portuguese and Russian in addition to the English original.

### Adding localization strings
1. Edit `TranscriberAdmin-en-1.2.xliff` adding a new `<trans-unit>` element for each string. This element should have an id with two parts: the contest and the string id. Normally the context refers to the file where the string is used although we do have some strings in a shared context. The string itself is given as source and the file name containing the string is given in the `<context-group>` following the example. The target is left as an empty element. This is where any CrowdIn translation would be inserted in copies of this file for each localized language.
2. After the strings are added, go to the [CrowdIn site](https://crowdin.com/project/sil-transcriber/settings#files) and upload this file.
3. From the [translations tab](https://crowdin.com/project/sil-transcriber/settings#translations), build and download the translations file.
4. Move this file into the folder `<repo>\localization\CrowdInRefresh\bin\Debug\netcoreapp3.1` which is where the compiled version of CrowdInRefresh is located.
5. Drag this file (once it is in the same folder as `CrowdInRefresh.exe`) onto `CrowdInRefresh.exe`. This will open a terminal window which should not show any errors but should ask you to press a key to close the terminal window. This process will overwrite `<repo>\localization\SILTranscriberTranslations.zip` which is used by subsequent steps.
6. For each string added to localizations that are being maintained by the development team, it is nice to add a possible fall back string that will be used in place of the English fall back until translators do their work on the CrowdIn site to translate this newly added string. See `creating supported localization developer fall backs` below.
7. Once all the fall back strings are in place, navigate to `<repo>\localization\bin\Debug` where the compiled version of `upldateLocalization.exe` is located. Double click `updateLocalization.exe`. This will generate a new strings*.json file which will be placed in `<repo>\public\localization` and it will generate a new file containing the name of this strings file to be used by the code `<repo>\src\store\localization\exported-strings-name.json`. It will create new English fall back files for the code `<repo>\src\store\localization\reducers.tsx` and new types for Typescript intelisense  `<repo>\src\store\localization\model.tsx`. This step will also open a terminal window where the results will be shown. If any errors are shown, you may want to open a terminal window in the `<repo>\localization\bin\Debug` folder and launch `updateLocalization.exe`. Then you can see the errors. Normally it means the structure of one or more of the XML files is not correct because an angle bracket around an element tag is missing or duplicated. Fixt the error and re-run. If everything works correctly, you will see the copy commands reporting the copies have been made and you'll be asked to press a key to continue.
8. Anytime translaters complete new work on the CrowdIn site, the development team can include this in the code by repeating steps 3, 4, 5, and 7.

### Creating Supported-localization Developer-fall-backs
Performing step 7 above, will update `<repo>\localization\TranscriberAdmin-en.xlf`. If a lot of strings have been added, this is a convenient way to get the changes that need to be made to the related localization files. In other words, the changes made in this file can be copied to `<repo>\localization\TranscriberAdmin-fr.xlf`, `<repo>\localization\TranscriberAdmin-pt.xlf` and `<repo>\localization\TranscriberAdmin-ru.xlf`. This essentially creates the template where the new developer localization strings will be inserted. Alternatively, if a single string is being added (or just a few), it may be easier to edit these files and copy some `<unit>` element and make the changes (skipping the need to use step 7).

To generate the translations, we use the [DeepL site](https://www.deepl.com/translator#en/fr/Creating%20export%20file). The generated translation is placed in the target tag. This will need to be done for each string and in the file for each target localization language.

## Working in Linux
The `updateLocalization.exe` used in step 7 above requires a dependency that is only available for .net framework. So the code doesn't compile on Linux. Consequently the steps done by this tool will need to be done manually. The particular dependency is the one providing the XSLT 2.0 processing capability.
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
The strings*.json file is created by processing each language with MakeStrings-12.xsl and then combining them all with CombineStrings-12.xsl. The resulting file is edited to remove the outermost name.

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
