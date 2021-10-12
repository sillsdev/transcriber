cd ..\..
del ..\public\localization\strings*.json
copy strings*.json ..\public\localization
del strings*.json
copy exported-strings-name.json ..\src\store\localization
del exported-strings-name.json
copy localizationReducer.tsx ..\src\store\localization\reducers.tsx
del localizationReducer.tsx
copy localizeModel.tsx ..\src\store\localization\model.tsx
del localizeModel.tsx
pause
