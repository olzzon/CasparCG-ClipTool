import React, { Component } from 'react';
import '../css/Settings.css';
import Select from 'react-select';
import { reduxState } from '../../model/reducers/store'



//Redux:
import { connect } from "react-redux";


//Set style for Select dropdown component:
const selectorColorStyles = {
    control: styles => ({ ...styles, backgroundColor: '#676767', color: 'white', border: 0 }),
    option: (styles) => {
        return {
            backgroundColor: '#AAAAAA',
            color: 'white'
        };
    },
    singleValue: styles => ({ ...styles, color: 'white' }),
};


class SettingsPage extends Component {
    localState: any
    constructor(props) {
        super(props);
        this.localState = {
            settings: reduxState.settings[0],
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleDisableDragNDrop = this.handleDisableDragNDrop.bind(this);
        this.handleDisableOverlay = this.handleDisableOverlay.bind(this);
        this.handleTabTitle = this.handleTabTitle.bind(this);
        this.handleTabMediaFolder = this.handleTabMediaFolder.bind(this);
        this.handleTabDataFolder = this.handleTabDataFolder.bind(this);
        this.handleTabOverlayFolder = this.handleTabOverlayFolder.bind(this);
        this.handleTabWipe = this.handleTabWipe.bind(this);
        this.handleTabWipeOffset = this.handleTabWipeOffset.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.renderChannelSettings = this.renderChannelSettings.bind(this);
    }

    componentDidMount() {
    }

    handleChange(event) {
        var settingsCopy= Object.assign({}, this.localState.settings);
        settingsCopy[event.target.name] = event.target.value;
        this.setState(
            {settings: settingsCopy}
        );
    }

    handleDisableDragNDrop(event) {
        var settingsCopy= Object.assign({}, this.localState.settings);
        settingsCopy.disableDragNDrop = event.target.checked;
        this.setState(
            {settings: settingsCopy}
        );
    }

    handleDisableOverlay(event) {
        var settingsCopy= Object.assign({}, this.localState.settings);
        settingsCopy.disableOverlay = event.target.checked;
        this.setState(
            {settings: settingsCopy}
        );
    }

    handleTabTitle(event) {
        var settingsCopy= Object.assign({}, this.localState.settings);
        settingsCopy.tabData[event.target.name].title = event.target.value;
        this.setState(
            {settings: settingsCopy}
        );
    }

    handleTabMediaFolder(index, event) {
        var settingsCopy= Object.assign({}, this.localState.settings);
        settingsCopy.tabData[index].subFolder = event.value + "/";
        this.setState(
            {settings: settingsCopy}
        );
    }


    handleTabDataFolder(index, event) {
        var settingsCopy= Object.assign({}, this.localState.settings);
        settingsCopy.tabData[index].dataFolder = event.value  + "/";
        this.setState(
            {settings: settingsCopy}
        );
    }

    handleTabOverlayFolder(index, event) {
        var settingsCopy= Object.assign({}, this.localState.settings);
        settingsCopy.tabData[index].overlayFolder = event.value  + "/";
        this.setState(
            {settings: settingsCopy}
        );
    }

    handleTabWipe(event) {
        var settingsCopy= Object.assign({}, this.localState.settings);
        settingsCopy.tabData[event.target.name].wipe = event.target.value;
        this.setState(
            {settings: settingsCopy}
        );
    }


    handleTabWipeOffset(event) {
        var settingsCopy= Object.assign({}, this.localState.settings);
        settingsCopy.tabData[event.target.name].wipeOffset = event.target.value;
        this.setState(
            {settings: settingsCopy}
        );
    }

    handleSubmit(event) {
    }

    renderChannelSettings(item, index) {
        return (
            <div className="Settings-channel-form" onSubmit={this.handleSubmit}>
                <label className="Settings-input-field">
                    OUT {index+1} NAME :
                    <br/>
                    <input name={index} type="text" value={item.title} onChange={this.handleTabTitle} />
                </label>
                <label className="Settings-input-field">
                    MEDIAFOLDER :
                    <Select
                        styles={selectorColorStyles}
                        className="Settings-input-selector"
                        value={{label: item.subFolder, value: item.subFolder}}
                        onChange={(event) => this.handleTabMediaFolder(index, event)}
                        options={[{value: 'VALUE', label: 'LABEL'}]}
                    />
                </label>
                <label className="Settings-input-field">
                    DATAFOLDER :
                    <Select
                        styles={selectorColorStyles}
                        className="Settings-input-selector"
                        value={{label: item.dataFolder, value: item.dataFolder}}
                        onChange={(event) => this.handleTabDataFolder(index, event)}
                        options={[{value: 'VALUE', label: 'LABEL'}]}
                    />
                </label>
                <label className="Settings-input-field">
                    TEMPLATEFOLDER :
                    <Select
                        styles={selectorColorStyles}
                        className="Settings-input-selector"
                        value={{label: item.overlayFolder, value: item.overlayFolder}}
                        onChange={(event) => this.handleTabOverlayFolder(index, event)}
                        options={[{value: 'VALUE', label: 'LABEL'}]}
                    />
                </label>
                <label className="Settings-input-field">
                    WIPE :
                    <br/>
                    <input name={index} type="text" value={item.wipe} onChange={this.handleTabWipe} />
                </label>
                <label className="Settings-input-field">
                    WIPE OFFSET :
                    <br/>
                    <input name={index} type="text" value={item.wipeOffset} onChange={this.handleTabWipeOffset} />
                </label>
            </div>
        )
    }

    render() {
        return (
            <div className="Settings-body">
            <p className="Settings-header">SETTINGS :</p>
            <form className="Settings-form" onSubmit={this.handleSubmit}>
                <div className="Settings-channel-form">
                    <label className="Settings-input-field">
                        IP ADDRESS :
                        <br/>
                        <input name="ipAddress" type="text" value={this.localState.settings.ipAddress} onChange={this.handleChange} />
                    </label>
                    <label className="Settings-input-field">
                        PORT :
                        <br/>
                        <input name="port" type="text" value={this.localState.settings.port} onChange={this.handleChange} />
                    </label>
                    <label className="Settings-input-field">
                        DISABLE DRAG´N´DROP :
                        <br/>
                        <input type="checkbox" checked={this.localState.settings.disableDragNDrop} onChange={this.handleDisableDragNDrop} />
                    </label>
                    <label className="Settings-input-field">
                    CLIPTOOL ONLY :
                    <br/>
                    <input type="checkbox" checked={this.localState.settings.disableOverlay} onChange={this.handleDisableOverlay} />
                </label>
                </div>

                <br/>
                {this.renderChannelSettings(this.localState.settings.tabData[0], 0)}
                {this.renderChannelSettings(this.localState.settings.tabData[1], 1)}
                {this.renderChannelSettings(this.localState.settings.tabData[2], 2)}
                {this.renderChannelSettings(this.localState.settings.tabData[3], 3)}
                <input className="Save-button" type="submit" value="SAVE SETTINGS" />
            </form>
            </div>
        );
    }
}


const mapStateToProps = (state) => {
    return {
        store: state
    }
}

export default connect(mapStateToProps)(SettingsPage);