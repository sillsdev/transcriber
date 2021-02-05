cd bin\debug
updatelocalization.exe
cd ..\..
copy strings.json ..\public\localization
del strings.json
copy localizationReducer.tsx ..\src\store\localization\reducers.tsx
del localizationReducer.tsx
copy localizeModel.tsx ..\src\store\localization\model.tsx
del localizeModel.tsx
pause