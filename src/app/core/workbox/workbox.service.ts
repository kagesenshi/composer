import {Injectable} from "@angular/core";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {DataGatewayService} from "../data-gateway/data-gateway.service";
import * as YAML from "js-yaml";
import {Observable} from "rxjs";
import {TabData} from "./tab-data.interface";
import {AppTabData} from "./app-tab-data";

@Injectable()
export class WorkboxService {

    public tabs = new BehaviorSubject([]);

    public activeTab = new BehaviorSubject(undefined);

    constructor(private dataGateway: DataGatewayService) {

    }

    public openTab(tab) {

        const {tabs}   = this.extractValues();
        const foundTab = tabs.find(existingTab => existingTab.id === tab.id);

        if (foundTab) {
            this.activateTab(foundTab);
            return;
        }

        this.tabs.next(tabs.concat(tab));
        this.activateTab(tab);

    }

    public closeTab(tab?) {
        if (!tab) {
            tab = this.extractValues().activeTab;
        }

        const currentlyOpenTabs = this.tabs.getValue();
        const tabToRemove       = currentlyOpenTabs.find(t => t.id === tab.id);
        const newTabList        = currentlyOpenTabs.filter(t => t !== tabToRemove);

        this.tabs.next(newTabList);
        this.ensureActiveTab();
    }

    public closeOtherTabs(tab) {
        this.tabs.next([tab]);
        this.activateTab(tab);
    }

    public closeAllTabs() {
        this.tabs.next([]);
    }

    public activateNext() {
        const {tabs, activeTab} = this.extractValues();
        const index             = tabs.indexOf(activeTab);
        const newActiveTab      = index === (tabs.length - 1) ? tabs[0] : tabs[index + 1];

        this.activateTab(newActiveTab);
    }

    public activatePrevious() {
        const {tabs, activeTab} = this.extractValues();
        const index             = tabs.indexOf(activeTab);
        const newActiveTab      = index ? tabs[index - 1] : tabs[tabs.length - 1];

        this.activateTab(newActiveTab);
    }

    private ensureActiveTab() {
        const {tabs, activeTab} = this.extractValues();
        if (!tabs.find(t => t === activeTab)) {
            this.activateTab(tabs[tabs.length - 1]);
        }
    }

    private extractValues() {
        return {
            activeTab: this.activeTab.getValue(),
            tabs: this.tabs.getValue()
        };
    }

    private activateTab(tab) {
        if (this.activeTab.getValue() === tab) {
            return;
        }

        this.activeTab.next(tab);
    }

    public getOrCreateFileTab(fileID): Observable<TabData<AppTabData>> {

        const currentTab = this.tabs.getValue().find(tab => tab.id === fileID);
        if (currentTab) {
            return Observable.of(currentTab);
        }


        return this.dataGateway.fetchFileContent(fileID).map(content => {

            const dataSource = DataGatewayService.getFileSource(fileID);

            const tab = {
                id: fileID,
                label: fileID,
                type: "Code",
                isWritable: dataSource !== "public",
                data: {
                    id: fileID,
                    isWritable: dataSource !== "public",
                    dataSource,
                    language: "json",
                    parsedContent: {},
                    fileContent: content,
                    resolve: (fcontent: string) => this.dataGateway.resolveContent(fcontent, fileID)
                }
            };

            if (fileID.endsWith(".yml") || fileID.endsWith(".yaml")) {
                tab.data.language = "yaml";
            }

            try {

                const parsed = YAML.safeLoad(content, {json: true});

                tab.data.parsedContent = parsed;

                if (dataSource === "public") {
                    tab.id = parsed.id;
                }

                if (dataSource !== "local") {
                    tab.data.fileContent = JSON.stringify(parsed, null, 4);
                }

                console.log("Parsed class", parsed);

                tab.label = parsed.label || fileID;
                tab.type  = parsed.class || "Code";
            } catch (ex) {
                console.warn("Could not parse app", ex);
            }

            if (dataSource === "local") {
                tab.label = fileID.split("/").pop();
            }

            console.log("Prepared app tab", tab);
            return tab as any;

        });
    }

}
