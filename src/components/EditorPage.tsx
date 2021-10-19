import React, { ChangeEvent, Component, FormEvent, RefObject } from "react";
import { TextChange } from "../interfaces";
import "./EditorPage.css";

export type Vec2 = [number, number];

interface EditorPageProps {
    fileName: string;
    commitChange: (change: TextChange) => void; // 用于发送变更
    onReceiveChangeListeners: Map<string, (change: TextChange) => void>; // 用于接收其它客户端的变更
}
 
interface EditorPageState {
    text: string;
    selection: Vec2;
    locked: boolean;
}
 
class EditorPage extends Component<EditorPageProps, EditorPageState> {
    constructor(props: EditorPageProps) {
        super(props);
        this.state = { 
            text: '',
            selection: [0, 0],
            locked: true,
        };
    }

    componentDidMount() {
        this.props.onReceiveChangeListeners.set(this.props.fileName, this.onReceiveChange);
        this.props.commitChange({ fileName: this.props.fileName, content: null });
    }

    componentWillUnmount() {
        this.props.onReceiveChangeListeners.delete(this.props.fileName);
    }

    componentDidUpdate() {
        if (this.needResetSelectionRange) {
            const e = this.iptRef.current;
            if (e) {
                const selection = this.state.selection;
                e.setSelectionRange(...selection);
                e.value = this.state.text;
            }
            this.needResetSelectionRange = false;
        }
    }

    iptRef: RefObject<HTMLTextAreaElement> = React.createRef();

    render() { 
        const s = this.state;

        return (
            <div className="editor">
                <textarea
                    ref={ this.iptRef }
                    value={ this.state.text }
                    disabled={ s.locked }
                    onSelect={ this.onSelect }
                    onInput={ this.onInput }
                    onChange={ this.onChange }
                />
            </div>
        );
    }

    onSelect = (e: ChangeEvent<HTMLTextAreaElement>) => {
        this.setState(() => ({ selection: [e.target.selectionStart, e.target.selectionEnd] }));
    }

    onChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        this.setState(() => ({ text: e.target.value }));
    }

    onInput = (e: FormEvent<HTMLTextAreaElement>) => {
        const target = e.currentTarget;
        const selection: Vec2 = [target.selectionStart, target.selectionEnd];
        this.setState(() => ({ selection }));
        // const nativeEvent: InputEvent = e.nativeEvent as InputEvent;
        // switch (nativeEvent.inputType) {
        //     case 'insertText': break;
        // }
        this.props.commitChange({ fileName: this.props.fileName, content: this.iptRef.current?.value || '' });
    } 

    getSelection(): Vec2 {
        const e = this.iptRef.current;
        if (e) {
            return [e.selectionStart, e.selectionEnd];
        } else return [0, 0];
    }

    needResetSelectionRange = false;

    onReceiveChange = (change: TextChange) => {
        this.needResetSelectionRange = true;
        this.setState(s => ({ 
            selection: this.getSelection(), 
            text: change.content || '',
            locked: !(s.locked || typeof change.content === 'string'),
        }));
    }
}
 
export default EditorPage;