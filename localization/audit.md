In I Bash window in the root folder of the repo, I used this command to identify the string prefixes:

```sh
grep -h -R --include=*.tsx -E -e'localStrings' src|grep -o -E -e'[a-zA-Z0-9]+\:' |sort|uniq|grep -o -E -e'[a-zA-Z0-9]+'
```

I copied the results into an editor and used find and replace to create a list separated by vertical bars to use in this command:

```sh
grep -h -R --include=*.tsx -o -E -e'[^A-Za-z0-9](activityState|cardStrings|controlStrings|pickerStrings|projButtonStr|projButtonStrings|s|sharedStr|sharedStrings|t|taskItemStr|tc|td|todoStr|tpb|transcriberStr|ts|vProjectStrings)\.[A-Za-z0-9]+' src|grep -o -E -e'[A-Za-z0-9]+$'|sort|uniq>../res1.txt
```

I opened this file in Notepad++ and did a replace to create `nameList.xml` which was in the format:

```xml
<names>
<n>accepted</n>
<n>yes</n>
</names>
```

where each localization key was in a n element. This is used by `filter-12.xslt` and `filter-20.xslt` to filter and sort the localization file to contain just the strings that are referenced in the source.
