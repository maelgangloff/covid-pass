import React from 'react';
import ReactDOM from 'react-dom'
import {CovidCard} from './components/CovidCard'

interface State {
  hcert: string
}
class App extends React.Component<object, State> {
  
  constructor(props: object) {
    super(props)
    this.state = {hcert: ''}
  }

  render() {
    return <>
    <div className="noprint">
      <h3>This is a tool for printing your EU Digital COVID Certificate.</h3>
      <p>Scan your qr code with a qr code decoder app then copy the text starting with 'HC1:' and insert it below.</p>
      <input type="text" value={this.state.hcert} onChange={(e) => this.setState({hcert: e.target.value})} placeholder="HC1:" />
      <button onClick={() => {
        ReactDOM.render(<CovidCard hcert={this.state.hcert}/>, document.getElementById('card'))
        window.print()
      }}>Print the card</button>
    </div>
    <div id="card"></div>
    </>
  }
}

export default App;
