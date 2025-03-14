import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import React, {useEffect, useState} from "react";
import {MainComponent, GUIComponent} from "./Component";
import {Layout, FullLayout, GUIBottomComponent, DefaultAppComponent} from "./Component";
import {CreateAppState, ControlPanel} from "./anigraph";

import AppClasses from "./FinalProject/Main/"
// import AppClasses from "./FinalProject/ExampleApps/Example0"
// import AppClasses from "./FinalProject/ExampleApps/Example1"
// import AppClasses from "./FinalProject/ExampleApps/Example2"
// import AppClasses from "./FinalProject/ExampleApps/Example3"
// import AppClasses from "./FinalProject/ExampleApps/ShaderDemo"
// import AppClasses from "./FinalProject/ExampleApps/ShaderDemoUnabridged"


const AppComponentClass = AppClasses.ComponentClass??DefaultAppComponent;

const sceneModel = new AppClasses.SceneModelClass();
const appState = CreateAppState(sceneModel);
sceneModel.initAppState(appState);

appState.createMainRenderWindow(AppClasses.SceneControllerClass);
const initConfirmation = appState.confirmInitialized();

// const LayoutToUse = FullLayout;
const LayoutToUse = Layout;



function MainApp() {
    useEffect(() => {
        window.addEventListener('keydown', function(e) {
            if(e.key == " " && e.target == document.body) {
                e.preventDefault();
            }
        });

        initConfirmation.then(()=> {
                console.log("Main Initialized.");
                appState.updateControlPanel();
            }
        );
    }, []);


    return (
        <div>
            <div className={"control-panel-parent"}>
                <ControlPanel appState={appState}></ControlPanel>
            </div>
            <LayoutToUse>
                <div className={"container-fluid"} id={"anigraph-app-div"}>
                    <div className={"row anigraph-row"}>
                        <div className={`col-${appState.getState("CanvasColumnSize")??10} anigraph-component-container`}>
                            <MainComponent renderWindow={appState.mainRenderWindow} name={appState.sceneModel.name}>
                                <GUIComponent appState={appState}>
                                    <AppComponentClass model={sceneModel}></AppComponentClass>
                                </GUIComponent>
                            </MainComponent>
                        </div>
                    </div>
                    <div className={"row"}>
                        <div className={`col-${appState.getState("CanvasColumnSize")??10} anigraph-component-container`}>
                            <GUIBottomComponent appState={appState}>
                            </GUIBottomComponent>
                        </div>
                    </div>
                </div>
            </LayoutToUse>
        </div>
    );
}

export default MainApp;
