cd ..\..
copy strings.json ..\public\localization
del strings.json
copy localizationReducer.tsx ..\src\reducer
del localizationReducer.tsx
copy localizeModel.tsx ..\src\model
del localizeModel.tsx
pause