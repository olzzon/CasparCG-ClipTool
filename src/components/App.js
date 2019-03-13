import React, { PureComponent } from 'react';
import {CasparCG} from 'casparcg-connection';
import { Tabs } from 'rmc-tabs';

//Apollo-Client Graphql implementation:
import gql from "graphql-tag";
import { ALL_CHANNELS_QUERY, ALL_CHANNELS_SUBSCRIPTION } from '../graphql/CasparCgQuery';

//Redux:
import { connect } from "react-redux";

// Components:
import Thumbnail from './Thumbnail';
import SettingsPage from './Settings';

//Utils:
import { saveSettings, loadThumbsOrder } from '../util/SettingsStorage';
import {cleanUpFilename} from '../util/filePathStringHandling';
import CcgLoadPlay from '../util/CcgLoadPlay';
import HandleAutoNext from '../util/HandleAutoNext';
import HandleOverlay from '../util/HandleOverlay';
import HandleShortcuts from '../util/HandleShortcuts';
import LoadThumbs from '../util/LoadThumbs';


//CSS files:
import '../assets/css/Rmc-tabs.css';
import '../assets/css/App.css';
import '../assets/css/App-header.css';
import '../assets/css/App-mini-header.css';


const MIX_DURATION = 6;

class App extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            ccgIsUpdated: false,
            showSettingsMenu: false,
            tabData: []
        };

        //BINDS:
        this.checkConnectionStatus = this.checkConnectionStatus.bind(this);
        this.handleSettingsPage = this.handleSettingsPage.bind(this);
        this.handleAutoPlayStatus = this.handleAutoPlayStatus.bind(this);
        this.handleLoopStatus = this.handleLoopStatus.bind(this);
        this.ccgSubscribeTimeLeft = this.ccgSubscribeTimeLeft.bind(this);
        this.ccgSubscribeInfoData = this.ccgSubscribeInfoData.bind(this);
        this.renderFullHeader = this.renderFullHeader.bind(this);
        this.renderMiniHeader = this.renderMiniHeader.bind(this);
        this.updatePlayingStatus = this.updatePlayingStatus.bind(this);
        this.ccgMediaFilesChanges = this.ccgMediaFilesChanged.bind(this);
    }


    componentWillMount() {

        //Define Output Tabs:
        let tabs = this.props.store.data[0].channel
                .map((item, index) => {
                    return this.props.store.settings[0].tabData[index];
                });
        //Hide Tabs with no name:
        tabs = tabs.filter((item) => {
            return item.title != "";
        });
        this.setState({tabData: tabs});

        this.ccgConnection = new CasparCG(
            {
                host: this.props.store.settings[0].ipAddress,
                port: this.props.store.settings[0].port,
                autoConnect: true,
            });

        loadThumbsOrder(this.ccgConnection);
        this.ccgLoadPlay = new CcgLoadPlay(this.ccgConnection);
        this.handleOverlay = new HandleOverlay(this.ccgConnection);
        this.handleAutoNext = new HandleAutoNext(this.ccgLoadPlay);
        this.handleShortcuts = new HandleShortcuts(this.ccgLoadPlay);
        this.loadThumbs = new LoadThumbs(this.ccgConnection);


        // Initialize CasparCG subscriptions:
        this.ccgSubscribeInfoData();
        this.ccgSubscribeTimeLeft();
        this.ccgMediaFilesChanged();

        // Initialize timer connection status:
        var connectionTimer = setInterval(this.checkConnectionStatus, 2000);

    }

    componentDidMount() {

    }

    //Logical funtions:
    reloadPage() {
        location.reload();
    }

    checkConnectionStatus() {
        let { appNav, data } = this.props.store;
        window.apolloClient.query({
            query: gql`
                {
                    serverOnline
                }`
            })
        .then((response) => {
            //Check order of clips:
            loadThumbsOrder(this.ccgConnection);
            this.loadThumbs.sortThumbnails(
                data[0].channel[appNav[0].activeTab].thumbList,
                appNav[0].activeTab + 1
            );
            this.updatePlayingStatus(appNav[0].activeTab);

            this.props.dispatch({
                type: 'SET_CONNECTION_STATUS',
                data: response.data.serverOnline
            });
            this.handleAutoNext.isAutoNextStopped();
        })
        .catch((error) => {
            console.log(error);
            this.props.dispatch({
                type: 'SET_CONNECTION_STATUS',
                data: false
            });
        });
    }

    //Handler functions:
    handleSettingsPage() {
        this.setState({showSettingsMenu: !this.state.showSettingsMenu});
    }

    handleAutoPlayStatus() {
        this.props.dispatch({
            type:'AUTOPLAY_STATUS',
            data: this.props.store.appNav[0].activeTab
        });
        saveSettings(this.props.store.settings[0]);
    }

    handleLoopStatus() {
        this.props.dispatch({
            type:'LOOP_STATUS',
            data: this.props.store.appNav[0].activeTab
        });
        saveSettings(this.props.store.settings[0]);
    }

    setActiveTab(tab) {
        this.props.dispatch({
            type: 'SET_ACTIVE_TAB',
            data: tab
        });
    }


    ccgSubscribeTimeLeft() {
        var _this2 = this;
        //Subscribe to CasparCG-State changes:
        window.apolloClient.subscribe({
            query: gql`
                subscription {
                    timeLeft {
                        timeLeft
                        time
                    }
                }`
        })
        .subscribe({
            next(response) {
                _this2.props.dispatch({
                    type:'SET_TIMELEFT',
                    data: response.data,
                });
                response.data.timeLeft.map((item, index) => {
                    _this2.handleAutoNext.autoNext(item, index);
                    _this2.handleOverlay.overlay(item, index);
                });
            },
            error(err) { console.error('Subscription error: ', err); },
        });
    }

    ccgSubscribeInfoData() {
        var _this2 = this;
        //Initial query channels to object:
        window.apolloClient.query({
        query: ALL_CHANNELS_QUERY
        })
        .then((response) => {
            console.log("InfoData request Data: ", response.data);
            _this2.props.dispatch({
                type:'SET_INFO_CHANNEL',
                data: response.data.channels
            });
            response.data.channels.map((item,index) => {
                _this2.loadThumbs.loadThumbs(index + 1)
                .then(() => {
                    _this2.updatePlayingStatus(index);
                });
            });


            //Subscribe to CasparCG-State changes:
            window.apolloClient.subscribe({
                query: ALL_CHANNELS_SUBSCRIPTION
            })
            .subscribe({
                next(response) {
                    _this2.props.dispatch({
                        type:'SET_LAYER_10',
                        data: response.data
                    });
                    response.data.playLayer.map((item,index) => {
                        _this2.updatePlayingStatus(index);
                    });

                },
                error(err) { console.error('Subscription error: ', err); },
            });
        });
    }

    ccgMediaFilesChanged() {
        var _this2 = this;
        //Subscribe to CasparCG-State changes:
        window.apolloClient.subscribe({
            query: gql`
                subscription {
                    mediaFilesChanged
                }`
        })
        .subscribe({
            next(response) {
                console.log("Media Files Changed");
                this.tabData.map((data, index) => {
                    _this2.loadThumbs.loadThumbs(index+1);
                });
            },
            error(err) { console.error('Subscription error: ', err); },
        });
    }


    updatePlayingStatus(tab) {
        //Don´t update if data not loaded:
        if (this.props.store.data[0].ccgInfo.length < 1) {
            console.log("Still loading....");
            return;
        }

        var infoStatus = this.props.store.data[0].ccgInfo[tab].layers[10-1] || '';

        var fileNameFg = cleanUpFilename(infoStatus.foreground.name || '');
        var fileNameBg = cleanUpFilename(infoStatus.background.name || '');
        this.props.store.data[0].channel[tab].thumbList
        .map((item, index)=>{

            //Handle Foreground:
            if(item.name.includes(fileNameFg)) {
                this.props.dispatch({
                    type: 'SET_THUMB_ACTIVE_INDEX',
                    data: {
                        tab: tab,
                        thumbActiveIndex: index
                    }
                });
            }
            //Handle Background:
            if(item.name.includes(fileNameBg)) {
                this.props.dispatch({
                    type: 'SET_THUMB_ACTIVE_BG_INDEX',
                    data: {
                        tab: tab,
                        thumbActiveBgIndex: index
                    }
                });
            }
        });
    }

    //Rendering functions:

    renderFullHeader() {
        let { appNav, data, settings} = this.props.store;

        return (
            <header className="App-header">
                <div className="App-title-background">
                    <img src=
                        {data[0].
                            channel[appNav[0].activeTab]
                            .thumbList[data[0].channel[appNav[0].activeTab].thumbActiveBgIndex]
                            .thumbPix || ''
                        }
                        className="App-header-pvw-thumbnail-image"
                        />
                    <button className="App-header-pgm-counter">
                        {data[0].ccgTimeCounter[appNav[0].activeTab]}
                    </button>
                    <img src=
                        {data[0].
                            channel[appNav[0].activeTab]
                            .thumbList[data[0].channel[appNav[0].activeTab].thumbActiveIndex]
                            .thumbPix || ''
                        }
                        className="App-header-pgm-thumbnail-image"
                    />
                </div>

                <div className="App-reload-setup-background">
                    <button className="App-connection-status"
                        style={
                            appNav[0].connectionStatus
                            ? {backgroundColor: "rgb(0, 128, 4)"}
                            : {backgroundColor: "red"}
                        }
                    >
                        {appNav[0].connectionStatus ? "CONNECTED" : "CONNECTING"}
                    </button>
                    <button className="App-settings-button"
                        onClick={this.handleSettingsPage}>
                        SETTINGS
                    </button>
                    <button className="App-reload-button"
                        onClick={this.reloadPage}>
                        RELOAD
                    </button>
                </div>

                <div className="App-loop-autoPlay-background">
                    <button className="App-loop-button"
                        onClick={this.handleLoopStatus}
                        style={
                            settings[0].tabData[appNav[0].activeTab].loop
                            ? {backgroundColor: 'rgb(28, 115, 165)'}
                            : {backgroundColor: 'grey'}
                        }
                    >
                        LOOP
                    </button>
                    <button className="App-autoPlay-button"
                        onClick={this.handleAutoPlayStatus}
                        style={
                            settings[0].tabData[appNav[0].activeTab].autoPlay
                            ? {backgroundColor: 'red'}
                            : {backgroundColor: 'grey'}
                        }
                    >
                        AUTO NEXT
                    </button>
                </div>

                <div className="App-mix-button-background">
                    <button className="App-prev-cue-button"
                        onClick={
                            () => this.ccgLoadPlay.prevCue(appNav[0].activeTab + 1)
                        }
                    >
                        PREV
                    </button>
                    <button className="App-next-cue-button"
                        onClick={
                            () => this.ccgLoadPlay.nextCue(appNav[0].activeTab + 1)
                        }
                    >
                        NEXT
                    </button>
                    <button className="App-mix-button"
                        onClick={
                            () => this.ccgLoadPlay.pvwPlay(appNav[0].activeTab + 1)
                        }
                    >
                        MIX
                    </button>
                    <button className="App-start-button"
                        onClick={
                            () => this.ccgLoadPlay.pgmPlay(appNav[0].activeTab + 1)
                        }
                    >
                        START
                    </button>
                </div>
            </header>
        )
    }


    renderMiniHeader() {
        let { appNav, data, settings} = this.props.store;

        return (
            <header className="App-mini-header">
                <div className="App-mini-title-background">
                    <img src=
                        {data[0]
                            .channel[appNav[0].activeTab]
                            .thumbList[data[0].channel[appNav[0].activeTab].thumbActiveBgIndex]
                            .thumbPix || ''
                        }
                        className="App-mini-header-pvw-thumbnail-image"
                        />
                    <button className="App-mini-header-pgm-counter">
                        {data[0].ccgTimeCounter[appNav[0].activeTab]}
                    </button>
                    <div className="App-mini-header-title">
                        { data[0]
                            .channel[appNav[0].activeTab]
                            .thumbList[data[0].channel[appNav[0].activeTab].thumbActiveIndex]
                            .name
                            || ''
                        }
                    </div>
                    <img src=
                        {data[0].
                            channel[appNav[0].activeTab]
                            .thumbList[data[0].channel[appNav[0].activeTab].thumbActiveIndex]
                            .thumbPix || ''
                        }
                        className="App-mini-header-pgm-thumbnail-image"
                    />
                </div>

                <div className="App-mini-reload-setup-background">
                    <button className="App-mini-connection-status"
                        style={
                            appNav[0].connectionStatus
                            ? {backgroundColor: "rgb(0, 128, 4)"}
                            : {backgroundColor: "red"}
                        }
                    >
                        {appNav[0].connectionStatus ? "CONNECTED" : "CONNECTING"}
                    </button>
                    <button className="App-mini-settings-button"
                        onClick={this.handleSettingsPage}>
                        SETTINGS
                    </button>
                    <button className="App-mini-reload-button"
                        onClick={this.reloadPage}>
                        RELOAD
                    </button>
                </div>


                <div className="App-mini-loop-autoPlay-background">
                    <button className="App-mini-loop-button"
                        onClick={this.handleLoopStatus}
                        style={
                            settings[0].tabData[appNav[0].activeTab].loop
                            ? {backgroundColor: 'rgb(28, 115, 165)'}
                            : {backgroundColor: 'grey'}
                        }
                    >
                        LOOP
                    </button>
                    <button className="App-mini-autoPlay-button"
                        onClick={this.handleAutoPlayStatus}
                        style={
                            settings[0].tabData[appNav[0].activeTab].autoPlay
                            ? {backgroundColor: 'red'}
                            : {backgroundColor: 'grey'}
                        }
                    >
                        AUTO NEXT
                    </button>
                </div>

                <div className="App-mini-mix-button-background">
                    <button className="App-mini-prev-cue-button"
                        onClick={
                            () => this.ccgLoadPlay.prevCue(appNav[0].activeTab + 1)
                        }
                    >
                        PREV
                    </button>
                    <button className="App-mini-next-cue-button"
                        onClick={
                            () => this.ccgLoadPlay.nextCue(appNav[0].activeTab + 1)
                        }
                    >
                        NEXT
                    </button>
                    <button className="App-mini-mix-button"
                        onClick={
                            () => this.ccgLoadPlay.pvwPlay(appNav[0].activeTab + 1)
                        }
                    >
                        MIX
                    </button>
                    <button className="App-mini-start-button"
                        onClick={
                            () => this.ccgLoadPlay.pgmPlay(appNav[0].activeTab + 1)
                        }
                    >
                        START
                    </button>
                </div>
            </header>
        )
    }

    renderTabData() {
        var tabDataList = this.state.tabData.map((item) => {
            return (
                <div className="App-intro" key={(item.key)}>
                    <Thumbnail
                        ccgOutputProps={item.key}
                        ccgConnectionProps= {this.ccgConnection}
                        loadMediaProps={this.ccgLoadPlay.loadMedia}
                        loadBgMediaProps={this.ccgLoadPlay.loadBgMedia}
                        updatePlayingStatusProps={this.updatePlayingStatus.bind(this)}
                        handleOverlayProps={this.handleOverlay}
                    />
                </div>
            )
        })
        return (tabDataList)
    }

    render() {
        return (
        <div className="App">
            {this.props.store.settings[0].miniView ?
                <this.renderMiniHeader/>
                : <this.renderFullHeader/>
            }
            {this.state.showSettingsMenu ?
                <SettingsPage/>
                : null
            }
            <div className="App-body">
            <Tabs
                tabs={this.state.tabData}
                onChange={(tab, index) => this.setActiveTab(index)}
            >
                {this.renderTabData()}
            </Tabs>
            </div>
        </div>
        )
    }
}


const mapStateToProps = (state) => {
    return {
        store: state
    }
}

export default connect(mapStateToProps)(App);
