import React, {Component} from 'react';
import {createDrawing} from './api';

class DrawingForm extends Component {
    constructor(props) {
        super(props);

        this.state = {drawingName: ''};
    }

    handleSubmit = (event) => {
        event.preventDefault();
        createDrawing(this.state.drawingName);
        this.setState({drawingName: ''});
    }

    render() {
        return (
            <div className='Form'>
                <form onSubmit={this.handleSubmit}>
                    <input type="text" onChange={evt => this.setState({drawingName: evt.target.value})} value={this.state.drawingName} placeholder="Drawing name" className="Form-drawingInput" required/>
                    <button type="submit" className="Form-DrawingInput">Create</button>
                </form>
            </div>
        )
    }
}

export default DrawingForm;