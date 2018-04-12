
import React from 'react';
//import PropTypes from 'prop-types';

import { bindActionCreators, getState } from 'redux';
import { connect } from 'react-redux';
import { logger } from 'nrfconnect/core';
import { Panel, Form, FormGroup, ControlLabel, FormControl, InputGroup, Checkbox } from 'react-bootstrap';

import * as DeviceDetailsActions from '../actions/deviceDetailsActions';
import * as AdapterActions from '../actions/adapterActions';

import { traverseItems, findSelectedItem } from './../common/treeViewKeyNavigation';
import { getInstanceIds } from '../utils/api';

const NOTIFY = 1;
const INDICATE = 2;
const CCCD_UUID = "2902"

export class DeviceDetailsContainer extends React.PureComponent {

    constructor(props) {
        super(props)
        this.buttonClicked = this.buttonClicked.bind(this)
        this.toggleCharacteristicWrite = this.toggleCharacteristicWrite.bind(this)
        this.onToggleNotify = this.onToggleNotify.bind(this)
        this.findCccdDescriptor = this.findCccdDescriptor.bind(this)
        this.isNotifying = this.isNotifying.bind(this)
        this.checkBoxClicked = this.checkBoxClicked.bind(this)
        this.expandAttribute = this.expandAttribute.bind(this)
        this.getSensorServices = this.getSensorServices.bind(this)

        this.state = {
            temperatureIsChecked: false,
            pressureIsChecked: false,
            humidityIsChecked: false,
        };
    }

    static contextTypes = {
        store: React.PropTypes.object
    }

    findCccdDescriptor(children) {
        if (!children) { return undefined; }
        return children.find(child => child.uuid === CCCD_UUID);
    }

    isNotifying(cccdDescriptor) {
        if (!cccdDescriptor) { return false; }
        const valueArray = cccdDescriptor.value.toArray();
        if (valueArray.length < 2) { return false; }
        return ((valueArray[0] & (NOTIFY | INDICATE)) > 0);
    }

    onToggleNotify(characteristic) {
        const cccdDescriptor = this.findCccdDescriptor(characteristic.get("children")) //fiks hardkoding
        const isDescriptorNotifying = this.isNotifying(cccdDescriptor);
        const hasNotifyProperty = characteristic.properties.notify//this.props.item.properties.notify;
        const hasIndicateProperty = characteristic.properties.indicate//this.props.item.properties.indicate;

        if (cccdDescriptor === undefined) { return; }
        if (!hasNotifyProperty && !hasIndicateProperty) { return; }

        let cccdValue;
        logger.error(cccdDescriptor.value);
        if (!isDescriptorNotifying) {
            if (hasNotifyProperty) {
                cccdValue = NOTIFY;
            } else {
                cccdValue = INDICATE;
            }
        } else {
            cccdValue = 0;
        }
        const value = [cccdValue, 0];
        //this.props.onWriteDescriptor(this.cccdDescriptor, value);
        this.context.store.dispatch(DeviceDetailsActions.writeDescriptor(cccdDescriptor, value))
    }

    getSensorServices(){
        let state = this.context.store.getState()
        const deviceKey = state.app.adapter.connectedDevice + ".0"

        const deviceDetails = state.app.adapter.getIn(['adapters', state.app.adapter.selectedAdapterIndex, 'deviceDetails']);
        const thingy = deviceDetails.devices.get(deviceKey);
        const sensorServices = thingy.get("children")
        return sensorServices;
    }

    toggleCharacteristicWrite(attributeID,characteristicID) {
        let state = this.context.store.getState()
        const deviceKey = state.app.adapter.connectedDevice + ".0"
        const service = this.getSensorServices().get(deviceKey + attributeID)
        this.onToggleNotify(service.get("children").get(deviceKey + attributeID + characteristicID))
    }

    buttonClicked() {
        this.expandAttribute(".5")
    }   

    checkBoxClicked(event){
        switch(event.target.value){
            case "5.6":
                this.setState({ temperatureIsChecked: !this.state.temperatureIsChecked })
                this.toggleCharacteristicWrite(".5",".6")
                break;
            case "5.7":
                this.setState({ pressureIsChecked: !this.state.pressureIsChecked })
                this.toggleCharacteristicWrite(".5",".7")
                break;
            case "5.8":
                this.setState({ humidityIsChecked: !this.state.humidityIsChecked })
                this.toggleCharacteristicWrite(".5",".8")
                break;
            case "5.9":
                break;
        }
    }

    expandAttribute(attributeID){
        let state = this.context.store.getState()
        const deviceKey = state.app.adapter.connectedDevice + ".0"

        const deviceDetails = state.app.adapter.getIn(['adapters', state.app.adapter.selectedAdapterIndex, 'deviceDetails'])
        const thingy = deviceDetails.devices.get(deviceKey)
        const sensorServices = thingy.get("children")
        const attribute = sensorServices.get(deviceKey + attributeID)
        this.context.store.dispatch(DeviceDetailsActions.setAttributeExpanded(attribute, true))
        //console.log("sensorServices: ", JSON.stringify(sensorServices,null,2))    
    }


    render() {

        // Styles
        const settingsPanelStyle = {
            width: "40%",
            background: "white",
        }
        const statusContainerStyle = {
        }
        const statusStyle = {
            //borderRight: "1px solid lightgrey"
        }
        const nextPublishStyle = {
        }

        return (
            <Panel style={settingsPanelStyle}>
                <h3><b> Settings </b></h3>
                <hr/>
                <div className="container-fluid">
                    <div className="row" style={statusContainerStyle}>
                        <div className="col-md-6 col-md-auto" style={statusStyle}>
                            <b>Status</b><br/>
                            Not publishing
                        </div>
                        <div className="col-md-6 col-md-auto" style={nextPublishStyle}>
                            <b>Next Publish</b><br/>
                            Never
                        </div>
                    </div>
                </div>
                <hr/>
                <Form>
                    
                </Form>
                <hr/>
                <FormGroup>
                    <ControlLabel>Select what sensor data should be published</ControlLabel>
                        <Checkbox value="5.6" checked={this.state.temperatureIsChecked} onChange={this.checkBoxClicked} >Temperature</Checkbox>
                        <Checkbox value="5.7" checked={this.state.pressureIsChecked} onChange={this.checkBoxClicked} >Pressure</Checkbox>
                        <Checkbox value="5.8" checked={this.state.humidityIschecked} onChange={this.checkBoxClicked} >Humidity</Checkbox>
                </FormGroup>
                <button
                    title="Clear list (Alt+C)"
                    type="button"
                    className="btn btn-primary btn-lg btn-nordic padded-row"
                >Start publishing</button>
                <hr/>

                <div><button onClick={this.buttonClicked}>expand attributes</button></div>
                
            </Panel>

        );
    }

}

/*
<div><button onClick={this.writeDescriptorButtonClicked}>write descriptor</button></div>

                    <FormGroup>
                        <ControlLabel>How often should the data be published?</ControlLabel>
                        <InputGroup class="input-group-lg">
                            <InputGroup.Addon>Every</InputGroup.Addon>
                            <FormControl type="text" value="10" />
                            <InputGroup.Addon>minutes</InputGroup.Addon>
                        </InputGroup>
                    </FormGroup>
                    <hr/>

*/




/*
const details = ({deviceDetails}) => {
    return (
        <div>
            {deviceDetails}
        </div>)
    }


function mapStateToProps(state) {
    console.log("mapStateToprops")
    const {
        adapter,
    } = state.app;

    const selectedAdapter = adapter.getIn(['adapters', adapter.selectedAdapterIndex]);

    if (!selectedAdapter) {
        return {};
    }

    return {
        deviceDetails: selectedAdapter.deviceDetails
    };
}


export default connect(
    mapStateToProps,
)(details)


*/

