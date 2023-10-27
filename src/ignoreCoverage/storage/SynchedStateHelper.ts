import {action, createStore, useStoreActions, useStoreState} from "easy-peasy";
import {KeyExtractorHelper} from "./KeyExtractorHelper";
import {SynchedStates} from "./SynchedStates";
import {SynchedVariableInterface} from "./SynchedVariableInterface";
import {DataClumpsTypeContext} from "data-clumps-type-context";
import {useEffect, useState} from "react";

export function useSynchedState(storageKey): [value: string, setValue: (value) => {}] {
    const value = useStoreState((state) => {
      return state[storageKey]?.value
    });
    const setValue = useStoreActions((actions) => actions[storageKey].setValue);
    return [
        value,
        setValue
    ]
}

export function useSynchedJSONState(storageKey): [value: any, setValue: (value) => {}] {
  const [jsonStateAsString, setJsonStateAsString] = useSynchedState(storageKey);
  const parsedJSON = JSON.parse(jsonStateAsString || "null");
  const setValue = (dict) => {
      //console.log("set value");
      //console.log(dict);
      setJsonStateAsString(JSON.stringify(dict));
      //console.log(JSON.stringify(dict));
  }
  return [
    parsedJSON,
      // @ts-ignore
    setValue
  ]
}

export type ModalOptions = {
    visible: boolean,
    content: any,
    title: any,
}
export function useSynchedModalState(storageKey): [value: ModalOptions, setValue: (value: ModalOptions) => void] {
    const [modalOptions, setModalOptions] = useSynchedJSONState(storageKey);

    const useModalOptions = modalOptions || {
        visible: false,
        content: null,
        title: null,
    };

    const setValue = (dict) => {
        setModalOptions(dict);
    }
    return [
        useModalOptions,
        setValue
    ]
}

export enum ViewOptionValues {
    settings = "settings",
    input = "input",
    output = "output",
}

export enum ViewPanelValues {
    leftPanel = "leftPanel",
    middlePanel = "middlePanel",
    rightPanel = "rightPanel",
    editor = "editor",
}

export type ViewOptions = {
    [ViewPanelValues.leftPanel]: string,
    [ViewPanelValues.middlePanel]: string,
    [ViewPanelValues.rightPanel]: string,
    editor: string,
}
export function useSynchedViewOptions(): [value: ViewOptions, setValue: (value) => {}] {
    const [viewOptions, setViewOptions] = useSynchedJSONState(SynchedStates.viewOptions)
    let useViewOptions = viewOptions || {
        [ViewPanelValues.leftPanel]: ViewOptionValues.input,
        [ViewPanelValues.middlePanel]: ViewOptionValues.settings,
        [ViewPanelValues.rightPanel]: ViewOptionValues.output
    };
    return [
        useViewOptions,
        setViewOptions
    ];
}

export function useDemoType(): string {
    const [demoType] = useSynchedState(SynchedStates.demoType);
    return demoType;
}

export function useSynchedActiveFileKey(): [value: any, setValue: (value) => {}] {
    const [activeFileKey, setActiveFileKey] = useSynchedJSONState(SynchedStates.activeFile)
    let activeFileKeyKey = activeFileKey || null;
    return [
        activeFileKeyKey,
        setActiveFileKey
    ];
}


export function useSynchedFileExplorerTree(initialTree): [any, ((value) => void)] {
    const [softwareProjectTree, setSoftwareProjectTree] = useSynchedJSONState(SynchedStates.softwareProjectTree)
    const setTreeWrapper = (tree: any) => {
        //console.log("setTreeWrapper")
        //console.log(tree)
        setSoftwareProjectTree(tree);
    }
    return [
        softwareProjectTree || initialTree,
        setTreeWrapper
    ];
}

export function useSynchedInputFile(): [value: DataClumpsTypeContext | null, setValue: (value) => {}] {
    const [inputFileContent, setInputFileContent] = useSynchedJSONState(SynchedStates.input)
    let useInputFileContent = inputFileContent || null

    return [
        useInputFileContent,
        setInputFileContent
    ];
}

export function useSynchedOpenedFiles(): [value: any, setValue: (value) => {}] {
    const [openedFileKeys, setOpenedFileKeys] = useSynchedJSONState(SynchedStates.openedFiles)
    let openedFileKeysList = openedFileKeys || [];
    return [
        openedFileKeysList,
        setOpenedFileKeys
    ];
}


export enum ColorModeOptions {
    light = "light",
    dark = "dark",
    auto = "auto"
}
export function useSynchedColorModeOption(): [value: any, setValue: (value) => {}] {
    const [colorModeOption, setColorModeOption] = useSynchedJSONState(SynchedStates.colorModeOption)
    let usedColorMode = colorModeOption || ColorModeOptions.auto;
    return [
        usedColorMode,
        setColorModeOption
    ];
}

const useIsSystemDarkDetector = () => {
    const getCurrentTheme = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
    const [isDarkTheme, setIsDarkTheme] = useState(getCurrentTheme());
    const mqListener = (e => {
        setIsDarkTheme(e.matches);
    });

    useEffect(() => {
        const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");
        darkThemeMq.addListener(mqListener);
        return () => darkThemeMq.removeListener(mqListener);
    }, []);
    return isDarkTheme;
}

export function useIsDarkModeEnabled(): any {
    const [colorModeOption, setColorModeOption] = useSynchedColorModeOption();
    const isSystemDark = useIsSystemDarkDetector();

    if(!!colorModeOption){
        if(colorModeOption===ColorModeOptions.auto){
            return isSystemDark
        } else {
            return colorModeOption===ColorModeOptions.dark;
        }
    } else {
        return isSystemDark;
    }
}


/**
export function useSynchedProject(): [value: SoftwareProject, setValue: (value) => {}] {
    const [projectObj, setProject] = useSynchedJSONState(SynchedStates.softwareProject)
    let project = new SoftwareProject()
    if(!projectObj){

    } else {
        project.filesToParseDict = projectObj.filesToParseDict
    }
    return [
        projectObj,
        setProject
    ];
}
 */



export class SynchedStateHelper {

    private static store;
    private static globalSynchedStoreModels: {[key: string] : any} = {};

    static getContextStore(){
        return SynchedStateHelper.store;
    }

    static getRequiredStorageKeys(){
        return KeyExtractorHelper.getListOfStaticKeyValues(SynchedStates);
    }

    public static registerSynchedState(key: string, defaultValue?: string, beforeHook?, afterHook?, override: boolean = false){
        let additionalModel = SynchedStateHelper.globalSynchedStoreModels[key];
        if(!!additionalModel && !override){
            return new Error("Additional variable for storage already exists for that key: "+key);
        }
        SynchedStateHelper.globalSynchedStoreModels[key] = new SynchedVariableInterface(key, defaultValue, beforeHook, afterHook);
    }

    static registerSynchedStates(listOfKeys: string[] | string, defaultValue?: string, beforeHook?, afterHook?, override: boolean = false){
        if (typeof listOfKeys === 'string'){
            listOfKeys = [listOfKeys];
        }

        for(let i=0; i<listOfKeys.length; i++){
            let key = listOfKeys[i];
            SynchedStateHelper.registerSynchedState(key, defaultValue, beforeHook, afterHook, override);
        }
    }

    private static handleAction(storageKey, state, payload, aditionalStoreModel: SynchedVariableInterface){
        let beforeHook = aditionalStoreModel.beforeHook;
        let afterHook = aditionalStoreModel.afterHook;
        let cancel = false;
        if(!!beforeHook){
            cancel = !beforeHook(storageKey, state, payload);
        }
        if(!cancel){
            state.value = payload;
            if(!!afterHook){
                afterHook(storageKey, state, payload);
            }
        }
    }

    static initSynchedKeys(){
        SynchedStateHelper.registerSynchedStates(SynchedStateHelper.getRequiredStorageKeys())
    }

    static initContextStores(){
        let model = {};

        let additionalKeys = Object.keys(SynchedStateHelper.globalSynchedStoreModels);

        for(let i=0; i<additionalKeys.length; i++){
            let key = additionalKeys[i];
            let aditionalStoreModel: SynchedVariableInterface = SynchedStateHelper.globalSynchedStoreModels[key];
            let storageKey = aditionalStoreModel.key;
            model[storageKey] = {
                value: aditionalStoreModel.defaultValue,
                setValue: action((state, payload) => {
                    SynchedStateHelper.handleAction(storageKey, state, payload, aditionalStoreModel);
                })
            }
        }

        const store = createStore(
            model
        );

        SynchedStateHelper.store = store;
    }

}
