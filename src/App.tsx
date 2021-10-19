import React from 'react';
import './App.css';
import EditorPage from './components/EditorPage';
import { TextChange } from './interfaces';

interface AppProps {

}

interface AppState {
  fileNames: string[];
  currentFileName: string;
}

class App extends React.Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);

    const initFileName = this.genFileName();

    this.state = this.loadState() || { 
      fileNames: [initFileName],
      currentFileName: initFileName,
    };
  }

  commitQueue: TextChange[] = [];
  webSocket: WebSocket | null = null;
  onReceiveChangeListeners = new Map<string, (change: TextChange) => void>();

  startConnect() {
    this.webSocket = new WebSocket('ws://' + window.location.hostname + ':8081');
    this.webSocket.onmessage = (ev) => {
      const data = ev.data as string;
      const change: TextChange = JSON.parse(data);
      this.onReceiveChangeListeners.get(change.fileName)?.(change);
    }

    this.webSocket.onopen = () => {
      let lt;
      while (!!(lt = this.commitQueue.shift())) {
        this.commitChange(lt);
      }
    }

    this.webSocket.onerror = () => {
      this.webSocket?.close();
      this.startConnect();
    }
  }

  componentDidMount() {
    this.startConnect();
  }

  componentWillUnmount() {
    this.webSocket?.close();
  }

  componentDidUpdate() {
    localStorage.setItem("notebook-of-mine", JSON.stringify(this.state));
  }

  render() {
    return (
      <div className="App">
        <div className="tabs">
          { this.state.fileNames.map(this.renderTab) }
          <div 
            className="tab" 
            key="add" 
            onClick={ this.addNewFile.bind(this, true) }
          >+</div>
        </div>

        <div className="editor-wrapper">
          { this.state.currentFileName ? (
              <EditorPage
                key={ this.state.currentFileName }
                fileName={ this.state.currentFileName }
                commitChange={ this.commitChange }
                onReceiveChangeListeners={ this.onReceiveChangeListeners }
              />
            ) : null } 
        </div>
      </div>
    );
  }

  renderTab = (tab: string, index: number) => {
    return (
      <div 
        className={ "tab" + (this.state.currentFileName === tab ? " actived" : "") } 
        key={ index }
        onClick={ () => this.setState(() => ({ currentFileName: tab })) }
      >
        <span className="text">{ tab }</span>
        <span className="close-button" onClick={ this.removeFile.bind(this, tab) }>×</span>
      </div>
    )
  }

  commitChange = (change: TextChange) => {
    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      console.log("commitChange", change);
      this.webSocket?.send(JSON.stringify(change));
    } else {
      this.commitQueue.push(change);
    }
  }

  loadState(): AppState | null {
    const str = localStorage.getItem("notebook-of-mine") || '';
    try {
      const json = JSON.parse(str);
      if (
        typeof json === 'object' && 
        typeof json.currentFileName === 'string' && 
        Array.isArray(json.fileNames) && 
        json.fileNames.every((it: any) => typeof it === 'string')
      ) {
        return {
          currentFileName: json.currentFileName,
          fileNames: json.fileNames.slice(),
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  genFileName() {
    return new Date().toLocaleTimeString() + '.txt';
  }

  addNewFile = (andOpen: boolean = true) => {
    const fileName: string = (window.prompt("请输入文件名：") || '').trim();
    if (!fileName || /[\\/|&*?]/.test(fileName) || fileName === '..' || fileName === '.') {
      window.alert("不合法的名字！");
      return;
    }
    if (andOpen) {
      this.setState(s => ({
        fileNames: s.fileNames.concat(fileName),
        currentFileName: fileName,
      }));
    } else {
      this.setState(s => ({ fileNames: s.fileNames.concat(fileName) }));
    }
  }

  removeFile = (fileName: string) => {
    const index = this.state.fileNames.indexOf(fileName);
    if (index >= 0) {
      const newFielNames = this.state.fileNames.slice();
      newFielNames.splice(index, 1);
      if (this.state.currentFileName === fileName) {
        this.setState(() => ({ fileNames: newFielNames, currentFileName: '' }));
      } else {
        this.setState(() => ({ fileNames: newFielNames }));
      } 
    }
  }
}

export default App;
